import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const fetchNickname = async (supabase, userId: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("nickname")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("User not found");
  }

  return data.nickname;
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

    const { match_id, invite_code, player_b_id, current_location } = await req.json();

    if (!match_id || !invite_code || !player_b_id || !current_location) {
      throw new Error("Missing required fields");
    }

    const lat = Number(current_location?.lat);
    const lng = Number(current_location?.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("Invalid current_location coordinates");
    }

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, player_a_id, status, venue_id, match_metadata")
      .eq("id", match_id)
      .maybeSingle();

    if (matchError || !match) {
      throw new Error("Match not found");
    }

    const storedInvite = match.match_metadata?.invite_code;

    if (storedInvite !== invite_code) {
      throw new Error("Invalid invite code");
    }

    if (match.status !== "pending") {
      throw new Error("Match is not pending");
    }

    const { data: venueDistance, error: distanceError } = await supabase
      .from("venues")
      .select(
        `distance_meters:ST_Distance(geo_location, ST_MakePoint(${lng}, ${lat})::geography)`,
      )
      .eq("id", match.venue_id)
      .maybeSingle();

    if (distanceError || !venueDistance) {
      throw new Error("Failed to calculate distance");
    }

    const distance_meters = venueDistance.distance_meters;
    const is_lbs_verified = typeof distance_meters === "number"
      ? distance_meters < 100
      : false;

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        player_b_id,
        status: "locked",
        is_lbs_verified,
        distance_meters,
      })
      .eq("id", match_id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    const player_a_name = await fetchNickname(supabase, match.player_a_id);
    const player_b_name = await fetchNickname(supabase, player_b_id);

    await supabase
      .channel("plaza_events")
      .send({
        type: "broadcast",
        event: "HANDSHAKE_SUCCESS",
        payload: {
          match_id,
          player_a_name,
          player_b_name,
          status: "locked",
        },
      });

    return new Response(
      JSON.stringify({
        match_id,
        status: "locked",
        is_lbs_verified,
        distance_meters,
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
