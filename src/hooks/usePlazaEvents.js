import { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

const CHANNEL_NAME = 'plaza_events';

// How long a pending match is considered "fresh" (30 minutes)
const FRESH_WINDOW_MS = 30 * 60 * 1000;

const extractMatchId = (payload) =>
  payload.match_id ?? payload.matchId ?? payload.id;

const normalizeMatchPayload = (payload) => ({
  ...payload,
  id: extractMatchId(payload),
});

const usePlazaEvents = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const upsertMatch = (incoming) => {
      if (!incoming.id) {
        console.warn('[usePlazaEvents] upsertMatch: missing match_id, dropping payload', incoming);
        return;
      }
      setMatches((prev) => {
        const idx = prev.findIndex((m) => m.id === incoming.id);
        if (idx === -1) return [incoming, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...incoming };
        return next;
      });
    };

    const removeMatch = (matchId) => {
      setMatches((prev) => prev.filter((m) => m.id !== matchId));
    };

    // ── 1. Fetch existing pending matches from DB ──────────────────────────
    const fetchInitial = async () => {
      const since = new Date(Date.now() - FRESH_WINDOW_MS).toISOString();
      const { data, error: fetchErr } = await supabase
        .from('matches')
        .select(`
          id,
          status,
          is_lbs_verified,
          created_at,
          match_metadata,
          player_a:users!matches_player_a_id_fkey ( nickname, rating )
        `)
        .eq('status', 'pending')
        .gte('created_at', since)
        .order('created_at', { ascending: false });

      if (cancelled) return;

      if (fetchErr) {
        console.error('[usePlazaEvents] fetchInitial error', fetchErr);
        setError(fetchErr);
        setLoading(false);
        return;
      }

      const normalized = (data ?? []).map((row) => ({
        id: row.id,
        match_id: row.id,
        status: row.status,
        is_lbs_verified: row.is_lbs_verified,
        created_at: row.created_at,
        invite_code: row.match_metadata?.invite_code,
        game_type: row.match_metadata?.game_type,
        player_name: row.player_a?.nickname ?? '玩家',
        rating: row.player_a?.rating ?? null,
        venue_name: null,
      }));

      setMatches(normalized);
      setLoading(false);
    };

    fetchInitial();

    // ── 2. Subscribe to real-time broadcast for incremental updates ────────
    const channel = supabase
      .channel(CHANNEL_NAME)
      .on('broadcast', { event: 'MATCH_CREATED' }, ({ payload }) => {
        upsertMatch(normalizeMatchPayload(payload));
      })
      .on('broadcast', { event: 'HANDSHAKE_SUCCESS' }, ({ payload }) => {
        // Match is now locked — remove it from the open-invitation list
        const id = extractMatchId(payload);
        if (id) removeMatch(id);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          setError(new Error('Failed to subscribe to plaza_events'));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return { matches, loading, error };
};

export default usePlazaEvents;
