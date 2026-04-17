import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const generateInviteCode = () => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const values = new Uint8Array(6);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => charset[value % charset.length]).join("");
};

serve(async (req) => {
  // Handle CORS preflight
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

    // Use user-scoped client so Supabase validates the JWT (supports ES256)
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

    // Service client for DB writes (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const venue_id = body.venue_id ?? null;
    const game_type = body.game_type ?? null;
    const player_a_id = user.id;

    if (!game_type) {
      return new Response(JSON.stringify({ error: "Missing required field: game_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auto-upsert user row so new auth users don't cause "Player not found"
    const defaultNickname = user.email?.split("@")[0] ?? "玩家";
    await supabaseAdmin.from("users").upsert(
      { id: player_a_id, nickname: defaultNickname },
      { onConflict: "id", ignoreDuplicates: true }
    );

    // Fetch current user rating for rank badge display in plaza
    const { data: userRow } = await supabaseAdmin
      .from("users")
      .select("rating, nickname")
      .eq("id", player_a_id)
      .single();
    const playerRating = userRow?.rating ?? 1500;
    const playerNickname = userRow?.nickname ?? defaultNickname;

    const invite_code = generateInviteCode();
    const match_metadata = {
      invite_code,
      game_type,
      created_at: new Date().toISOString(),
    };

    const { data: match, error: matchError } = await supabaseAdmin
      .from("matches")
      .insert({
        player_a_id,
        venue_id: venue_id || null,
        status: "pending",
        is_lbs_verified: false,
        racks_won: 0,
        racks_lost: 0,
        match_metadata,
      })
      .select("id")
      .single();

    if (matchError || !match) {
      throw new Error(matchError?.message ?? "Failed to create match");
    }

    // Broadcast MATCH_CREATED to plaza_events for real-time frontend updates
    await supabaseAdmin.channel('plaza_events').send({
      type: 'broadcast',
      event: 'MATCH_CREATED',
      payload: {
        match_id: match.id,
        inviter: playerNickname,
        player_name: playerNickname, // legacy compat
        inviterRating: playerRating,
        rating: playerRating,
        venue_name: null,
        invite_code,
        game_type,
      }
    })

    return new Response(
      JSON.stringify({ match_id: match.id, invite_code, status: "pending" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
