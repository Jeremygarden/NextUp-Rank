import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const invite_code: string = body.invite_code;
    const player_b_id: string = body.player_b_id ?? authData.user.id;
    const current_location = body.current_location ?? null; // optional

    if (!invite_code) {
      throw new Error("Missing required field: invite_code");
    }

    // Find match by invite_code stored in match_metadata JSONB
    const { data: matches, error: matchErr } = await supabase
      .from("matches")
      .select("id, player_a_id, status, venue_id, match_metadata")
      .eq("status", "pending")
      .filter("match_metadata->>invite_code", "eq", invite_code);

    if (matchErr) throw new Error(matchErr.message);
    if (!matches || matches.length === 0) {
      throw new Error("Invalid invite code or match not found");
    }

    const match = matches[0];

    if (match.player_a_id === player_b_id) {
      throw new Error("Cannot join your own match");
    }

    // Auto-upsert player_b in users table
    await supabase
      .from("users")
      .upsert({ id: player_b_id }, { onConflict: "id", ignoreDuplicates: true });

    // Optional LBS check
    let distance_meters: number | null = null;
    let is_lbs_verified = false;

    if (current_location && match.venue_id) {
      const lat = Number(current_location.lat);
      const lng = Number(current_location.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const { data: venueData } = await supabase
          .from("venues")
          .select(
            `distance_meters:ST_Distance(geo_location, ST_MakePoint(${lng}, ${lat})::geography)`,
          )
          .eq("id", match.venue_id)
          .maybeSingle();

        if (venueData?.distance_meters != null) {
          distance_meters = venueData.distance_meters;
          is_lbs_verified = distance_meters < 200;
        }
      }
    }

    const { error: updateError } = await supabase
      .from("matches")
      .update({
        player_b_id,
        status: "locked",
        is_lbs_verified,
        distance_meters,
      })
      .eq("id", match.id);

    if (updateError) throw new Error(updateError.message);

    return new Response(
      JSON.stringify({
        match_id: match.id,
        status: "locked",
        is_lbs_verified,
        distance_meters,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
