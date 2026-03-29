import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const url = new URL(req.url);
    const venueId = url.searchParams.get("venue_id");

    let query = supabase
      .from("rating_snapshots")
      .select(
        "user_id, rating_before, rating_after, rd_after, created_at, users!rating_snapshots_user_id_fkey(nickname)" +
          (venueId ? ", matches!inner(venue_id)" : ""),
      )
      .order("created_at", { ascending: false })
      .limit(1000);

    if (venueId) {
      query = query.eq("matches.venue_id", venueId);
    }

    const { data, error } = await query;

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to fetch leaderboard");
    }

    const latestByUser = new Map();

    for (const snapshot of data) {
      if (latestByUser.has(snapshot.user_id)) {
        continue;
      }

      latestByUser.set(snapshot.user_id, snapshot);

      if (latestByUser.size >= 2000) {
        break;
      }
    }

    const leaderboard = Array.from(latestByUser.values())
      .map((snapshot) => ({
        user_id: snapshot.user_id,
        nickname: snapshot.users?.nickname ?? null,
        rating: snapshot.rating_after,
        rd: snapshot.rd_after,
        recent_delta: typeof snapshot.rating_after === "number" &&
            typeof snapshot.rating_before === "number"
          ? snapshot.rating_after - snapshot.rating_before
          : null,
      }))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 50)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry,
      }));

    return new Response(JSON.stringify(leaderboard), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
