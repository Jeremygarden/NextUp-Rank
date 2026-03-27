import { vi, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

const supabaseMock = vi.hoisted(() => {
  const eventHandlers = {};

  const channel = {
    on: (_type, filter, handler) => {
      eventHandlers[filter.event] = handler;
      return channel;
    },
    subscribe: (cb) => {
      if (cb) cb('SUBSCRIBED');
      return channel;
    },
  };

  return {
    channel: vi.fn(() => channel),
    removeChannel: vi.fn(),
    __getHandlers: () => eventHandlers,
    __resetHandlers: () => {
      Object.keys(eventHandlers).forEach((key) => delete eventHandlers[key]);
    },
  };
});

vi.mock('../../lib/supabaseClient', () => ({
  __esModule: true,
  default: supabaseMock,
}));

import usePlazaEvents from '../../hooks/usePlazaEvents';
import supabase from '../../lib/supabaseClient';

describe('usePlazaEvents handshake integration', () => {
  beforeEach(() => {
    supabase.__resetHandlers();
    supabase.channel.mockClear();
    supabase.removeChannel.mockClear();
  });

  it('goes from pending to locked when a handshake success arrives', async () => {
    const { result } = renderHook(() => usePlazaEvents());
    

    const handlers = supabase.__getHandlers();

    act(() => {
      handlers.MATCH_CREATED({
        payload: {
          match_id: 'match-1',
          player_name: 'Riley',
          distanceMeters: 92,
        },
      });
    });

    act(() => {
      handlers.HANDSHAKE_SUCCESS({
        payload: {
          match_id: 'match-1',
          status: 'locked',
          is_lbs_verified: true,
        },
      });
    });

    expect(result.current.matches).toHaveLength(1);
    expect(result.current.matches[0].status).toBe('locked');
  });

  it('flags is_lbs_verified when the LBS distance check passes', async () => {
    const { result } = renderHook(() => usePlazaEvents());
    

    const handlers = supabase.__getHandlers();

    act(() => {
      handlers.MATCH_CREATED({
        payload: {
          match_id: 'match-2',
          player_name: 'Jordan',
        },
      });
    });

    act(() => {
      handlers.HANDSHAKE_SUCCESS({
        payload: {
          match_id: 'match-2',
          status: 'locked',
          is_lbs_verified: true,
        },
      });
    });

    expect(result.current.matches[0].is_lbs_verified).toBe(true);
  });
});
