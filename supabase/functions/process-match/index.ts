// supabase/functions/process-match/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MATH_SERVICE_URL = Deno.env.get('MATH_SERVICE_URL')
const MATH_SERVICE_KEY = Deno.env.get('MATH_SERVICE_KEY')
const MATH_USE_MOCK = Deno.env.get('MATH_USE_MOCK')

if (MATH_USE_MOCK === 'false' && !MATH_SERVICE_URL) {
  throw new Error('MATH_USE_MOCK=false but MATH_SERVICE_URL is not configured')
}

function mockCalculateRating(params: {
  rating: number, rd: number, vol: number,
  racks_won: number, racks_lost: number,
  opp_rating: number, opp_rd: number
}) {
  const { rating, rd, vol, racks_won, racks_lost, opp_rating, opp_rd } = params
  const total = racks_won + racks_lost
  const s_adj = total > 0 ? 0.5 + ((racks_won - racks_lost) / total) * 0.5 : 0.5

  const q = Math.log(10) / 400
  const g_rd = 1 / Math.sqrt(1 + 3 * q * q * opp_rd * opp_rd / (Math.PI * Math.PI))
  const e = 1 / (1 + Math.pow(10, -g_rd * (rating - opp_rating) / 400))

  const d2 = 1 / (q * q * g_rd * g_rd * e * (1 - e))
  const delta = q / (1 / (rd * rd) + 1 / d2) * g_rd * (s_adj - e)

  const new_rating = Math.round((rating + delta) * 100) / 100
  const new_rd = Math.max(30, Math.sqrt(1 / (1 / (rd * rd) + 1 / d2)))
  const new_vol = vol

  return { new_rating, new_rd, new_vol }
}

serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return new Response(JSON.stringify({ error: "Missing authorization token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
    }

    const { match_id, racks_won: reqRacksWon, racks_lost: reqRacksLost } = await req.json()

    if (!match_id) {
      return new Response(JSON.stringify({ error: 'match_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Admin client for DB reads/writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Fix #5: atomic concurrency lock — only one invocation proceeds when status='locked'
    // If another concurrent call already flipped status to 'processing', this returns nothing
    const { data: lockRow, error: atomicLockError } = await supabase
      .from('matches')
      .update({ status: 'processing' })
      .eq('id', match_id)
      .eq('status', 'locked')
      .select('id')
      .maybeSingle()

    if (atomicLockError) {
      return new Response(JSON.stringify({ error: `Atomic lock failed: ${atomicLockError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!lockRow) {
      // Either already processing/completed or match not found — safe to skip
      return new Response(JSON.stringify({ error: 'Match not eligible for processing (already processing, completed, or not found)' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Fix #4: handle missing lock_and_get_match_data RPC gracefully
    const { data: matchData, error: lockError } = await supabase
      .rpc('lock_and_get_match_data', { mid: match_id })

    if (lockError) {
      // Check if the error is because the RPC doesn't exist (code PGRST202 / 42883)
      const isRpcMissing = lockError.code === 'PGRST202' || lockError.code === '42883' ||
        lockError.message?.includes('function') && lockError.message?.includes('does not exist')

      if (isRpcMissing) {
        return new Response(JSON.stringify({
          error: 'RPC lock_and_get_match_data is not defined. Please run the required database migration.',
          hint: 'supabase/migrations/*_add_lock_and_get_match_data.sql',
        }), {
          status: 501,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ error: `Lock RPC failed: ${lockError.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!matchData) {
      return new Response(JSON.stringify({ error: 'Match data not found or already processed' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Resolve racks: prefer request-supplied values over DB values
    const resolvedRacksWon = reqRacksWon ?? matchData.racks_won ?? 0
    const resolvedRacksLost = reqRacksLost ?? matchData.racks_lost ?? 0

    // Persist resolved racks back to matches table
    await supabase
      .from('matches')
      .update({ racks_won: resolvedRacksWon, racks_lost: resolvedRacksLost })
      .eq('id', match_id)

    const params = {
      rating: matchData.player_a.rating,
      rd: matchData.player_a.rd,
      vol: matchData.player_a.vol,
      racks_won: resolvedRacksWon,
      racks_lost: resolvedRacksLost,
      opp_rating: matchData.player_b.rating,
      opp_rd: matchData.player_b.rd
    }

    let new_rating: number, new_rd: number, new_vol: number

    const useMock = MATH_USE_MOCK === 'true' || (!MATH_SERVICE_URL && MATH_USE_MOCK !== 'false')

    async function callMathService(p: typeof params) {
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

    if (!useMock) {
      ;({ new_rating, new_rd, new_vol } = await callMathService(params))
    } else {
      console.warn('[process-match] Using mock calculator')
      ;({ new_rating, new_rd, new_vol } = mockCalculateRating(params))
    }

    const rating_before = matchData.player_a.rating

    const { error: updateError } = await supabase
      .rpc('atomic_update_user_rating', {
        target_user_id: matchData.player_a.id,
        new_rating,
        new_rd,
        new_vol,
        p_match_id: match_id
      })

    if (updateError) throw new Error(`Atomic update failed: ${updateError.message}`)

    // Player B: racks swapped (B's wins = A's losses and vice versa)
    const paramsB = {
      rating: matchData.player_b.rating,
      rd: matchData.player_b.rd,
      vol: matchData.player_b.vol,
      racks_won: resolvedRacksLost,   // B wins = A losses
      racks_lost: resolvedRacksWon,   // B losses = A wins
      opp_rating: matchData.player_a.rating,
      opp_rd: matchData.player_a.rd
    }

    let resultB: { new_rating: number, new_rd: number, new_vol: number }
    if (!useMock) {
      resultB = await callMathService(paramsB)
    } else {
      resultB = mockCalculateRating(paramsB)
    }

    const { error: updateErrorB } = await supabase
      .rpc('atomic_update_user_rating', {
        target_user_id: matchData.player_b.id,
        new_rating: resultB.new_rating,
        new_rd: resultB.new_rd,
        new_vol: resultB.new_vol,
        p_match_id: match_id
      })

    if (updateErrorB) throw new Error(`Atomic update (player_b) failed: ${updateErrorB.message}`)

    return new Response(JSON.stringify({
      status: 'success',
      player_a: { rating_before, rating_after: new_rating, new_rd },
      player_b: { rating_before: matchData.player_b.rating, rating_after: resultB.new_rating, new_rd: resultB.new_rd },
      // Legacy compat fields
      rating_before,
      rating_after: new_rating,
      new_rd,
      mock: useMock
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
