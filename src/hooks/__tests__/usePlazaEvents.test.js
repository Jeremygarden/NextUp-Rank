import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import supabase from '../../lib/supabaseClient';
import usePlazaEvents from '../usePlazaEvents';

vi.mock('../../lib/supabaseClient', () => ({
  default: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const channelMock = () => {
  const handlers = {};
  const channel = {
    on: vi.fn((type, filter, callback) => {
      handlers[filter.event] = callback;
      return channel;
    }),
    subscribe: vi.fn((callback) => {
      channel.subscribeCallback = callback;
      return channel;
    }),
    handlers,
  };

  return channel;
};

describe('usePlazaEvents', () => {
  it('starts in loading state', () => {
    const channel = channelMock();

    supabase.channel.mockReturnValue(channel);

    const { result } = renderHook(() => usePlazaEvents());

    expect(result.current.loading).toBe(true);
  });

  it('receives MATCH_CREATED event and updates matches', () => {
    const channel = channelMock();

    supabase.channel.mockReturnValue(channel);

    const { result } = renderHook(() => usePlazaEvents());

    act(() => {
      channel.handlers.MATCH_CREATED({
        payload: {
          match_id: 'match-1',
          player_name: 'Alex',
          rating: 1600,
          venue_name: 'Corner Club',
        },
      });
    });

    expect(result.current.matches[0]).toEqual({
      match_id: 'match-1',
      player_name: 'Alex',
      rating: 1600,
      venue_name: 'Corner Club',
    });
  });

  it('cleans up subscription on unmount', () => {
    const channel = channelMock();

    supabase.channel.mockReturnValue(channel);

    const { unmount } = renderHook(() => usePlazaEvents());

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(channel);
  });
});
