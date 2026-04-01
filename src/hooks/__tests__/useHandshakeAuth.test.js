import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import supabase from '../../lib/supabaseClient';
import useHandshake from '../useHandshake';

vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

describe('useHandshake auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds Authorization header when session exists', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'auth-token' } },
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'locked', distance_meters: 10 }),
    });

    global.fetch = fetchMock;

    const { result } = renderHook(() => useHandshake());

    await act(async () => {
      await result.current.trigger({
        match_id: 'match-10',
        invite_code: 'INV10',
        player_b_id: 'player-10',
        current_location: { lat: 0, lng: 0 },
      });
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/match/handshake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer auth-token',
      },
      body: JSON.stringify({
        match_id: 'match-10',
        invite_code: 'INV10',
        player_b_id: 'player-10',
        current_location: { lat: 0, lng: 0 },
      }),
    });
  });

  it('runs fetch even when session is missing', async () => {
    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'locked', distance_meters: 10 }),
    });

    global.fetch = fetchMock;

    const { result } = renderHook(() => useHandshake());

    await act(async () => {
      await result.current.trigger({
        match_id: 'match-11',
        invite_code: 'INV11',
        player_b_id: 'player-11',
        current_location: { lat: 0, lng: 0 },
      });
    });

    expect(fetchMock).toHaveBeenCalled();
  });
});
