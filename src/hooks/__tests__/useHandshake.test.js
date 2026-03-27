import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import useHandshake from '../useHandshake';

describe('useHandshake', () => {
  it('calls the handshake endpoint with the correct payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'locked', distance_meters: 40 }),
    });

    global.fetch = fetchMock;

    const { result } = renderHook(() => useHandshake());

    await act(async () => {
      await result.current.trigger({
        match_id: 'match-1',
        invite_code: 'INV123',
        player_b_id: 'player-b',
        current_location: { lat: 0, lng: 0 },
      });
    });

    expect(fetchMock).toHaveBeenCalledWith('/api/match/handshake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        match_id: 'match-1',
        invite_code: 'INV123',
        player_b_id: 'player-b',
        current_location: { lat: 0, lng: 0 },
      }),
    });
  });

  it('returns success when status is locked', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'locked', distance_meters: 75 }),
    });

    global.fetch = fetchMock;

    const { result } = renderHook(() => useHandshake());

    let success = false;

    await act(async () => {
      success = await result.current.trigger({
        match_id: 'match-2',
        invite_code: 'INV999',
        player_b_id: 'player-c',
        current_location: { lat: 1, lng: 1 },
      });
    });

    expect(success).toBe(true);
    expect(result.current.result.is_lbs_verified).toBe(true);
  });
});
