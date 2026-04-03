import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
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

    // Admin client for DB writes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const match_id: string = body.match_id;

    if (!match_id) {
      throw new Error("Missing required field: match_id");
    }

    // Fetch match
    const { data: match, error: matchErr } = await supabaseAdmin
      .from("matches")
      .select("id, status, player_a_id, player_b_id")
      .eq("id", match_id)
      .maybeSingle();

    if (matchErr) throw new Error(matchErr.message);
    if (!match) {
      return new Response(JSON.stringify({ error: "Match not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Caller must be a participant
    if (match.player_a_id !== user.id && match.player_b_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden: you are not a participant of this match" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Match must be in an active (non-completed) state
    const abandonableStatuses = ['pending', 'locked', 'awaiting_confirmation', 'processing'];
    if (!abandonableStatuses.includes(match.status)) {
      return new Response(JSON.stringify({ error: `Cannot abandon match with status: ${match.status}` }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic update — only succeeds if status is still abandonable
    const { error: updateError, count } = await supabaseAdmin
      .from("matches")
      .update({ status: "abandoned" })
      .eq("id", match_id)
      .in("status", abandonableStatuses)
      .select()
      .then(r => ({ error: r.error, count: r.data?.length ?? 0 }));

    if (updateError) throw new Error(updateError.message);
    if (count === 0) {
      return new Response(JSON.stringify({ error: "Match could not be abandoned (status may have changed)" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Broadcast MATCH_ABANDONED to plaza_events
    await supabaseAdmin.channel('plaza_events').send({
      type: 'broadcast',
      event: 'MATCH_ABANDONED',
      payload: {
        match_id,
        abandoned_by: user.id,
      }
    });

    return new Response(
      JSON.stringify({ status: 'abandoned', match_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
