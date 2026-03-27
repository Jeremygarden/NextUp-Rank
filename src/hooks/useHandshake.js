import { useCallback, useState } from 'react';

import supabase from '../lib/supabaseClient';

const getDistanceMeters = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (typeof payload.distance_meters === 'number') {
    return payload.distance_meters;
  }

  if (payload.match && typeof payload.match.distance_meters === 'number') {
    return payload.match.distance_meters;
  }

  return null;
};

const getStatus = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (typeof payload.status === 'string') {
    return payload.status;
  }

  if (payload.match && typeof payload.match.status === 'string') {
    return payload.match.status;
  }

  return null;
};

const applyLbsVerification = (payload, is_lbs_verified) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }

  if (payload.match && typeof payload.match === 'object') {
    return {
      ...payload,
      match: {
        ...payload.match,
        is_lbs_verified,
      },
    };
  }

  return {
    ...payload,
    is_lbs_verified,
  };
};

const useHandshake = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const trigger = useCallback(async ({ match_id, invite_code, player_b_id, current_location }) => {
    setLoading(true);
    setError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch('/api/match/handshake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          match_id,
          invite_code,
          player_b_id,
          current_location,
        }),
      });

      if (!response.ok) {
        throw new Error('Handshake request failed');
      }

      const payload = await response.json();
      const distanceMeters = getDistanceMeters(payload);
      const is_lbs_verified = typeof distanceMeters === 'number' ? distanceMeters < 100 : false;
      const updatedPayload = applyLbsVerification(payload, is_lbs_verified);

      setResult(updatedPayload);

      return getStatus(updatedPayload) === 'locked';
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    trigger,
    loading,
    result,
    error,
  };
};

export default useHandshake;
