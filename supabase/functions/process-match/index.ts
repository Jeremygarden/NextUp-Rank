// supabase/functions/process-match/index.ts
// Standard Supabase Edge Function to process BG-1 match ratings

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MATH_SERVICE_URL = Deno.env.get('MATH_SERVICE_URL')!
const MATH_SERVICE_KEY = Deno.env.get('MATH_SERVICE_KEY')!

serve(async (req) => {
  try {
    const { match_id } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Transactional Read: Lock user rows and get data
    // Requires concurrency_fix.sql's RPC logic
    const { data: matchData, error: lockError } = await supabase
      .rpc('lock_and_get_match_data', { mid: match_id })

    if (lockError || !matchData) throw new Error(`Lock failed: ${lockError?.message}`)

    // 2. Call Python Math Service (BG-1 Logic)
    const response = await fetch(`${MATH_SERVICE_URL}/calculate-rating`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-KEY': MATH_SERVICE_KEY
      },
      body: JSON.stringify({
        rating: matchData.player_a.rating,
        rd: matchData.player_a.rd,
        vol: matchData.player_a.vol,
        racks_won: matchData.racks_won,
        racks_lost: matchData.racks_lost,
        opp_rating: matchData.player_b.rating,
        opp_rd: matchData.player_b.rd
      })
    })

    if (!response.ok) throw new Error(`Math calculation failed: ${response.statusText}`)
    const { new_rating, new_rd, new_vol } = await response.json()

    // 3. Atomic Update: Write back to DB
    // Using atomic_update_user_rating from concurrency_fix.sql
    const { error: updateError } = await supabase
      .rpc('atomic_update_user_rating', {
        target_user_id: matchData.player_a.id,
        new_rating,
        new_rd,
        new_vol
      })

    if (updateError) throw new Error(`Atomic update failed: ${updateError.message}`)

    return new Response(JSON.stringify({ 
      status: 'success', 
      new_rating, 
      new_rd 
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
