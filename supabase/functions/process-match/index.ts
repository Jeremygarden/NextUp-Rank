// supabase/functions/process-match/index.ts
// Refactored: player_a submits score → awaiting_confirmation (no Glicko-2 here)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    const { match_id, racks_won, racks_lost } = await req.json()

    if (!match_id) {
      return new Response(JSON.stringify({ error: 'match_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (racks_won === undefined || racks_lost === undefined) {
      return new Response(JSON.stringify({ error: 'racks_won and racks_lost are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Admin client for DB reads/writes
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Atomic concurrency lock — flip status from 'locked' → 'awaiting_confirmation'
    const { data: lockRow, error: atomicLockError } = await supabase
      .from('matches')
      .update({
        status: 'awaiting_confirmation',
        player_a_racks_won: racks_won,
        player_a_racks_lost: racks_lost,
        score_submitted_at: new Date().toISOString(),
        // Also write legacy fields for backwards-compat display
        racks_won,
        racks_lost,
      })
      .eq('id', match_id)
      .eq('status', 'locked')
      .select('id')
      .maybeSingle()

    if (atomicLockError) {
      return new Response(JSON.stringify({ error: `Atomic lock failed: ${atomicLockError.message}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!lockRow) {
      return new Response(JSON.stringify({ error: 'Match not eligible for processing (already submitted, not locked, or not found)' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Broadcast SCORE_SUBMITTED so player_b is notified
    await supabase
      .channel('plaza_events')
      .send({
        type: 'broadcast',
        event: 'SCORE_SUBMITTED',
        payload: { match_id, racks_won, racks_lost }
      })

    return new Response(JSON.stringify({
      status: 'awaiting_confirmation',
      match_id,
      racks_won,
      racks_lost,
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
