// supabase/functions/confirm-match/index.ts
// player_b confirms score → runs Glicko-2 settlement → RESULT_CONFIRMED
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MATH_SERVICE_URL = Deno.env.get('MATH_SERVICE_URL')
const MATH_SERVICE_KEY = Deno.env.get('MATH_SERVICE_KEY')
const MATH_USE_MOCK = Deno.env.get('MATH_USE_MOCK')

if (MATH_USE_MOCK === 'false' && !MATH_SERVICE_URL) {
  throw new Error('MATH_USE_MOCK=false but MATH_SERVICE_URL is not configured')
}

// Mock Glicko-2 calculator — matches math-service/main.py logic
// Used as fallback when math service is unreachable
function mockCalculateRating(params: {
  rating: number, rd: number, vol: number,
  racks_won: number, racks_lost: number,
  opp_rating: number, opp_rd: number
}) {
  const { rating, rd, vol, racks_won, racks_lost, opp_rating, opp_rd } = params
  const SCALE = 173.7178
  const TAU = 0.75 // Match math-service TAU

  const total = racks_won + racks_lost
  const s_adj = total > 0 ? 0.5 + ((racks_won - racks_lost) / total) * 0.5 : 0.5

  // Convert to Glicko-2 internal scale
  const mu = (rating - 1500) / SCALE
  const phi = rd / SCALE
  const mu_j = (opp_rating - 1500) / SCALE
  const phi_j = opp_rd / SCALE

  // g(phi_j) and E
  const g_phi_j = 1 / Math.sqrt(1 + 3 * phi_j * phi_j / (Math.PI * Math.PI))
  const E = 1 / (1 + Math.exp(-g_phi_j * (mu - mu_j)))

  // Variance v and delta
  const v = 1 / (g_phi_j * g_phi_j * E * (1 - E))
  const delta = v * g_phi_j * (s_adj - E)

  // Volatility update (simplified: use vol unchanged for mock)
  const new_vol = vol

  // Update phi and mu
  const phi_star = Math.sqrt(phi * phi + new_vol * new_vol)
  const new_phi = 1 / Math.sqrt(1 / (phi_star * phi_star) + 1 / v)
  const new_mu = mu + new_phi * new_phi * g_phi_j * (s_adj - E)

  const new_rating = Math.round((new_mu * SCALE + 1500) * 100) / 100
  const new_rd = Math.max(30, new_phi * SCALE)

  return { new_rating, new_rd, new_vol }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // User-scoped client — validates ES256 JWT
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { match_id } = await req.json()

    if (!match_id) {
      return new Response(JSON.stringify({ error: 'match_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client for DB reads/writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Pre-check: verify match status and that caller is the OTHER player (not the one who submitted)
    const { data: preCheck, error: preCheckError } = await supabase
      .from('matches')
      .select('id, status, player_a_id, player_b_id, submitted_by')
      .eq('id', match_id)
      .maybeSingle()

    if (preCheckError) {
      return new Response(JSON.stringify({ error: `DB error: ${preCheckError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!preCheck) {
      return new Response(JSON.stringify({ error: 'Match not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (preCheck.status !== 'awaiting_confirmation') {
      return new Response(JSON.stringify({ error: `Match is not awaiting confirmation (status: ${preCheck.status})` }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Only the OTHER participant (not the submitter) can confirm
    if (preCheck.submitted_by === user.id) {
      return new Response(JSON.stringify({ error: 'You cannot confirm your own submission' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (preCheck.player_a_id !== user.id && preCheck.player_b_id !== user.id) {
      return new Response(JSON.stringify({ error: 'You are not a participant in this match' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Atomic lock: flip status from awaiting_confirmation → processing
    const { data: lockRow, error: lockError } = await supabase
      .from('matches')
      .update({ status: 'processing' })
      .eq('id', match_id)
      .eq('status', 'awaiting_confirmation')
      .select('id')
      .maybeSingle()

    if (lockError) {
      return new Response(JSON.stringify({ error: `Atomic lock failed: ${lockError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!lockRow) {
      return new Response(JSON.stringify({ error: 'Match not eligible for confirmation (concurrent request or already processing)' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch full match data with player ratings
    const { data: matchRow, error: matchFetchError } = await supabase
      .from('matches')
      .select(`
        player_a_id,
        player_b_id,
        player_a_racks_won,
        player_a_racks_lost,
        submitted_by,
        player_a:users!matches_player_a_id_fkey(id, rating, rd, vol),
        player_b:users!matches_player_b_id_fkey(id, rating, rd, vol)
      `)
      .eq('id', match_id)
      .maybeSingle()

    if (matchFetchError || !matchRow) {
      return new Response(JSON.stringify({ error: `Failed to fetch match: ${matchFetchError?.message ?? 'not found'}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const playerA = Array.isArray(matchRow.player_a) ? matchRow.player_a[0] : matchRow.player_a
    const playerB = Array.isArray(matchRow.player_b) ? matchRow.player_b[0] : matchRow.player_b

    // player_a_racks_won/lost are stored from the SUBMITTER's perspective
    // We need to map them to the actual player_a/player_b in the DB
    const submittedByPlayerA = matchRow.submitted_by === matchRow.player_a_id
    const submitterRacksWon = matchRow.player_a_racks_won ?? 0
    const submitterRacksLost = matchRow.player_a_racks_lost ?? 0

    // From player_a's perspective (DB player_a):
    const resolvedRacksWon  = submittedByPlayerA ? submitterRacksWon  : submitterRacksLost
    const resolvedRacksLost = submittedByPlayerA ? submitterRacksLost : submitterRacksWon

    const useMock = MATH_USE_MOCK === 'true' || (!MATH_SERVICE_URL && MATH_USE_MOCK !== 'false')

    async function callMathService(p: {
      rating: number, rd: number, vol: number,
      racks_won: number, racks_lost: number,
      opp_rating: number, opp_rd: number
    }) {
      const response = await fetch(`${MATH_SERVICE_URL}/calculate-rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': MATH_SERVICE_KEY ?? ''
        },
        body: JSON.stringify(p)
      })
      if (!response.ok) throw new Error(`Math calculation failed: ${response.statusText}`)
      return response.json() as Promise<{ new_rating: number, new_rd: number, new_vol: number }>
    }

    // Calculate player_a new rating
    const paramsA = {
      rating: playerA.rating,
      rd: playerA.rd,
      vol: playerA.vol,
      racks_won: resolvedRacksWon,
      racks_lost: resolvedRacksLost,
      opp_rating: playerB.rating,
      opp_rd: playerB.rd
    }

    let resultA: { new_rating: number, new_rd: number, new_vol: number }
    if (!useMock) {
      resultA = await callMathService(paramsA)
    } else {
      console.warn('[confirm-match] Using mock calculator')
      resultA = mockCalculateRating(paramsA)
    }

    // Update player_a rating atomically
    const { error: updateErrorA } = await supabase
      .rpc('atomic_update_user_rating', {
        target_user_id: playerA.id,
        new_rating: resultA.new_rating,
        new_rd: resultA.new_rd,
        new_vol: resultA.new_vol,
        p_match_id: match_id,
        p_opponent_id: playerB.id,
        p_opponent_rating: playerB.rating,
      })

    if (updateErrorA) throw new Error(`Atomic update (player_a) failed: ${updateErrorA.message}`)

    // Calculate player_b new rating (racks swapped)
    const paramsB = {
      rating: playerB.rating,
      rd: playerB.rd,
      vol: playerB.vol,
      racks_won: resolvedRacksLost,  // B wins = A losses
      racks_lost: resolvedRacksWon,  // B losses = A wins
      opp_rating: playerA.rating,
      opp_rd: playerA.rd
    }

    let resultB: { new_rating: number, new_rd: number, new_vol: number }
    if (!useMock) {
      resultB = await callMathService(paramsB)
    } else {
      resultB = mockCalculateRating(paramsB)
    }

    // Update player_b rating atomically
    const { error: updateErrorB } = await supabase
      .rpc('atomic_update_user_rating', {
        target_user_id: playerB.id,
        new_rating: resultB.new_rating,
        new_rd: resultB.new_rd,
        new_vol: resultB.new_vol,
        p_match_id: match_id,
        p_opponent_id: playerA.id,
        p_opponent_rating: playerA.rating,
      })

    if (updateErrorB) throw new Error(`Atomic update (player_b) failed: ${updateErrorB.message}`)

    // Mark match as completed
    await supabase
      .from('matches')
      .update({ status: 'completed', confirmed_at: new Date().toISOString() })
      .eq('id', match_id)

    // Broadcast RESULT_CONFIRMED
    await supabase
      .channel('plaza_events')
      .send({
        type: 'broadcast',
        event: 'RESULT_CONFIRMED',
        payload: {
          match_id,
          player_a: { user_id: playerA.id, rating_before: playerA.rating, rating_after: resultA.new_rating, new_rd: resultA.new_rd },
          player_b: { user_id: playerB.id, rating_before: playerB.rating, rating_after: resultB.new_rating, new_rd: resultB.new_rd },
        }
      })

    return new Response(JSON.stringify({
      status: 'success',
      player_a: { user_id: playerA.id, rating_before: playerA.rating, rating_after: resultA.new_rating, new_rd: resultA.new_rd },
      player_b: { user_id: playerB.id, rating_before: playerB.rating, rating_after: resultB.new_rating, new_rd: resultB.new_rd },
      // Legacy compat fields
      rating_before: playerA.rating,
      rating_after: resultA.new_rating,
      new_rd: resultA.new_rd,
      mock: useMock
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
