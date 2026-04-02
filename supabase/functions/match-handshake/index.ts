import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // User-scoped client — lets Supabase validate ES256 JWT
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

    // Admin client for DB writes
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();
    const invite_code: string = body.invite_code;
    const player_b_id: string = body.player_b_id ?? user.id;
    const current_location = body.current_location ?? null;

    if (!invite_code) {
      throw new Error("Missing required field: invite_code");
    }

    const { data: matches, error: matchErr } = await supabaseAdmin
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
    const defaultNicknameB = user.email?.split("@")[0] ?? "玩家";
    await supabaseAdmin
      .from("users")
      .upsert({ id: player_b_id, nickname: defaultNicknameB }, { onConflict: "id", ignoreDuplicates: true });

    // LBS check — threshold is 100m (aligned with INTERFACE.md)
    let distance_meters: number | null = null;
    let is_lbs_verified = false;

    if (current_location && match.venue_id) {
      const lat = Number(current_location.lat);
      const lng = Number(current_location.lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const { data: venueData } = await supabaseAdmin
          .from("venues")
          .select(
            `distance_meters:ST_Distance(geo_location, ST_MakePoint(${lng}, ${lat})::geography)`,
          )
          .eq("id", match.venue_id)
          .maybeSingle();

        if (venueData?.distance_meters != null) {
          distance_meters = venueData.distance_meters;
          is_lbs_verified = distance_meters < 100; // standardized to 100m
        }
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("matches")
      .update({ player_b_id, status: "locked", is_lbs_verified, distance_meters })
      .eq("id", match.id);

    if (updateError) throw new Error(updateError.message);

    // Broadcast HANDSHAKE_SUCCESS to plaza_events for real-time frontend updates
    await supabaseAdmin.channel('plaza_events').send({
      type: 'broadcast',
      event: 'HANDSHAKE_SUCCESS',
      payload: {
        match_id: match.id,
        player_a_name: null,
        player_b_name: defaultNicknameB,
        status: 'locked',
        is_lbs_verified,
      }
    })

    return new Response(
      JSON.stringify({ match_id: match.id, status: "locked", is_lbs_verified, distance_meters }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
});
