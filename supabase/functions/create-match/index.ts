import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const generateInviteCode = () => {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const values = new Uint8Array(6);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => charset[value % charset.length]).join("");
};

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      throw new Error("Missing authorization token");
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData?.user) {
      throw new Error("Unauthorized");
    }

    const body = await req.json();
    const venue_id = body.venue_id ?? null;
    const game_type = body.game_type ?? null;
    // Support both explicit player_a_id and auto-resolve from token
    const player_a_id = body.player_a_id ?? authData.user.id;

    if (!game_type) {
      throw new Error("Missing required field: game_type");
    }

    // Auto-upsert user row so new auth users don't cause "Player not found"
    await supabase.from("users").upsert(
      { id: player_a_id },
      { onConflict: "id", ignoreDuplicates: true }
    );

    const invite_code = generateInviteCode();
    const match_metadata = {
      invite_code,
      game_type,
      created_at: new Date().toISOString(),
    };

    const { data: match, error: matchError } = await supabase
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

    return new Response(
      JSON.stringify({
        match_id: match.id,
        invite_code,
        status: "pending",
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});
