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

    const { player_a_id, venue_id, game_type } = await req.json();

    if (!player_a_id || !venue_id || !game_type) {
      throw new Error("Missing required fields");
    }

    const { data: player, error: playerError } = await supabase
      .from("users")
      .select("id")
      .eq("id", player_a_id)
      .maybeSingle();

    if (playerError || !player) {
      throw new Error("Player not found");
    }

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
        venue_id,
        status: "pending",
        is_lbs_verified: false,
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
