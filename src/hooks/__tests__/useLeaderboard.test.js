import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import supabase from '../../lib/supabaseClient';
import useLeaderboard from '../useLeaderboard';

vi.mock('../../lib/supabaseClient', () => ({
  default: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { access_token: 'token-abc' } },
  });
});

describe('useLeaderboard', () => {
  it('starts in loading state', async () => {
    // fetchMock that never resolves during initial render check
    let resolveResponse;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveResponse = resolve;
      })
    );
    global.fetch = fetchMock;

    const { result } = renderHook(() => useLeaderboard('venue-1'));

    // After mount, loading should be true immediately (before fetch resolves)
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Cleanup: resolve the promise so no lingering async work
    resolveResponse({ ok: true, json: async () => [] });
  });

  it('returns data on successful fetch', async () => {
    const mockPlayers = [
      { user_id: 'u1', nickname: 'Alice', rating: 1600, recent_delta: 10, recent_25_snapshots: [] },
      { user_id: 'u2', nickname: 'Bob', rating: 1500, recent_delta: -5, recent_25_snapshots: [] },
    ];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPlayers,
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useLeaderboard('venue-42'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(mockPlayers);
    expect(result.current.error).toBeNull();

    expect(fetchMock).toHaveBeenCalledWith(
      'https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/leaderboard?venue_id=venue-42',
      { headers: { Authorization: 'Bearer token-abc' } }
    );
  });

  it('fetches without venue_id when none provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useLeaderboard());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith(
      'https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/leaderboard',
      { headers: { Authorization: 'Bearer token-abc' } }
    );
  });

  it('sets error on failed fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });
    global.fetch = fetchMock;

    const { result } = renderHook(() => useLeaderboard('venue-err'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('Failed to fetch leaderboard');
    expect(result.current.data).toBeNull();
  });

  it('sets error on network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('Network error'));
    global.fetch = fetchMock;

    const { result } = renderHook(() => useLeaderboard('venue-net'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('Network error');
  });

  it('re-fetches when venueId changes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    global.fetch = fetchMock;

    const { result, rerender } = renderHook(({ venueId }) => useLeaderboard(venueId), {
      initialProps: { venueId: 'venue-A' },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    rerender({ venueId: 'venue-B' });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://tesdzxnmffmaxylcpjia.supabase.co/functions/v1/leaderboard?venue_id=venue-B',
      { headers: { Authorization: 'Bearer token-abc' } }
    );
  });
});
