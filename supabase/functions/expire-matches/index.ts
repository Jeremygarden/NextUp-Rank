import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Expire pending matches older than 30 minutes
    const { data: expired, error } = await supabase
      .from('matches')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .select('id')

    if (error) throw error

    const expiredIds = (expired ?? []).map(r => r.id)

    if (expiredIds.length > 0) {
      await supabase.channel('plaza_events').send({
        type: 'broadcast',
        event: 'MATCH_EXPIRED',
        payload: { expired_ids: expiredIds }
      })
    }

    return new Response(JSON.stringify({
      expired_count: expiredIds.length,
      expired_ids: expiredIds,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
