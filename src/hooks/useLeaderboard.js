import { useEffect, useState } from 'react';

import supabase from '../lib/supabaseClient';

const LEADERBOARD_URL =
  'https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/leaderboard';

const useLeaderboard = (venueId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const url = venueId
          ? `${LEADERBOARD_URL}?venue_id=${venueId}`
          : LEADERBOARD_URL;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const json = await response.json();

        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [venueId]);

  return { data, loading, error };
};

export default useLeaderboard;
