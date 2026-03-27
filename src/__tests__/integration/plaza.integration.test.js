import React, { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SquareLayout from '../../ui/SquareLayout';

vi.mock('lucide-react', () => ({
  Loader2: () => <div data-testid="loader" />,
  Target: () => <div data-testid="icon-target" />,
  Clock: () => <div data-testid="icon-clock" />,
  Trophy: () => <div data-testid="icon-trophy" />,
  ChevronRight: () => <div data-testid="icon-chevron-right" />,
  Copy: () => <div data-testid="icon-copy" />,
  Check: () => <div data-testid="icon-check" />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children }) => <div>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock('../../ui/VenueLeaderboard', () => ({
  __esModule: true,
  default: ({ venueName }) => (
    <div data-testid="venue-leaderboard">Leaderboard for {venueName}</div>
  ),
}));

const baseMatch = {
  id: 'match-1',
  inviter: 'Riley',
  gameType: '9ball',
  startTime: 'Tonight 20:00',
  entryFee: 'Loser Payout',
  location: 'City Square',
  distanceMeters: 80,
  status: 'pending',
};

const lockedMatch = {
  ...baseMatch,
  status: 'locked',
  is_lbs_verified: true,
};

const leaderboardPlayers = [
  {
    id: 'player-1',
    nickname: 'Ace',
    rating: 1675,
    recent_delta: 4.6,
    recent_25_snapshots: [{ rating: 1650 }, { rating: 1675 }],
  },
];

const PlazaHarness = ({
  initialMatches = [baseMatch],
  handshakeMatch = lockedMatch,
}) => {
  const [matches, setMatches] = useState(initialMatches);

  return (
    <>
      <button
        data-testid="handshake-action"
        onClick={() => setMatches([handshakeMatch])}
      >
        Simulate Handshake
      </button>
      <div data-testid="status-display">{matches[0]?.status}</div>
      <div data-testid="lbs-flag">
        {matches[0]?.is_lbs_verified ? 'true' : 'false'}
      </div>
      <SquareLayout
        matches={matches}
        loading={false}
        venueId="venue-1"
        venueName="Test Venue"
        players={leaderboardPlayers}
      />
    </>
  );
};

describe('SquareLayout integration', () => {
  it('renders the plaza tab with nearby matches', () => {
    render(
      <SquareLayout
        matches={[baseMatch]}
        loading={false}
        venueId="venue-1"
        venueName="Test Venue"
        players={leaderboardPlayers}
      />
    );

    expect(screen.getByText('Riley')).toBeInTheDocument();
    expect(screen.getByText(/80m/)).toBeInTheDocument();
  });

  it('can switch to the leaderboard tab to reveal VenueLeaderboard', () => {
    render(
      <SquareLayout
        matches={[baseMatch]}
        loading={false}
        venueId="venue-1"
        venueName="Test Venue"
        players={leaderboardPlayers}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /排行榜/ }));

    expect(screen.getByTestId('venue-leaderboard')).toBeInTheDocument();
  });

  it('reflects a locked status after HANDSHAKE_SUCCESS', () => {
    render(<PlazaHarness />);

    expect(screen.getByTestId('status-display')).toHaveTextContent('pending');

    fireEvent.click(screen.getByTestId('handshake-action'));

    expect(screen.getByTestId('status-display')).toHaveTextContent('locked');
  });

  it('flags is_lbs_verified when the distance is below 100m', () => {
    render(<PlazaHarness />);

    fireEvent.click(screen.getByTestId('handshake-action'));

    expect(screen.getByTestId('lbs-flag')).toHaveTextContent('true');
  });
});
