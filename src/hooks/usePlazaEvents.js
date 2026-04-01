import { useEffect, useState } from 'react';

import supabase from '../lib/supabaseClient';

const CHANNEL_NAME = 'plaza_events';

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
    const upsertMatch = (incoming) => {
      if (!incoming.id) {
        setMatches((prev) => [incoming, ...prev]);
        return;
      }

      setMatches((prev) => {
        const idx = prev.findIndex((match) => match.id === incoming.id);
        if (idx === -1) {
          return [incoming, ...prev];
        }
        const next = [...prev];
        next[idx] = { ...next[idx], ...incoming };
        return next;
      });
    };

    const channel = supabase
      .channel(CHANNEL_NAME)
      .on('broadcast', { event: 'MATCH_CREATED' }, ({ payload }) => {
        upsertMatch(normalizeMatchPayload(payload));
      })
      .on('broadcast', { event: 'HANDSHAKE_SUCCESS' }, ({ payload }) => {
        upsertMatch({
          ...normalizeMatchPayload(payload),
          status: payload.status ?? 'locked',
          is_lbs_verified: payload.is_lbs_verified,
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setLoading(false);
        }
        if (status === 'CHANNEL_ERROR') {
          setError(new Error('Failed to subscribe to plaza_events'));
          setLoading(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { matches, loading, error };
};

export default usePlazaEvents;
