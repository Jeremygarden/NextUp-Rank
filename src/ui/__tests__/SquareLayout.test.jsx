import { vi } from 'vitest';
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import SquareLayout from "../SquareLayout";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// Mock lucide-react
vi.mock("lucide-react", () => ({
  Loader2: () => <div data-testid="spinner" />,
  Target: () => <div />,
  Clock: () => <div />,
  Trophy: () => <div />,
  ChevronRight: () => <div />,
  Copy: () => <div />,
  Check: () => <div />,
}));

// Mock SmartInviteCard to keep tests focused on layout
vi.mock("../SmartInviteCard", () => ({ default: ({ inviter, location }) => (
  <div data-testid="smart-invite-card">{inviter} @ {location}</div>
)}));

// Mock VenueLeaderboard
vi.mock("../VenueLeaderboard", () => ({ default: ({ venueName }) => (
  <div data-testid="venue-leaderboard">{venueName}</div>
)}));

// Mock recharts (used inside VenueLeaderboard which is mocked anyway)
vi.mock("recharts", () => ({
  LineChart: ({ children }) => <svg>{children}</svg>,
  Line: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  YAxis: () => null,
}));

describe("SquareLayout", () => {
  const sampleMatches = [
    { id: "1", inviter: "Alice", location: "Club A", distanceMeters: 500 },
    { id: "2", inviter: "Bob", location: "Club B", distanceMeters: 100 },
  ];

  test("renders Plaza tab by default", () => {
    render(<SquareLayout matches={sampleMatches} />);
    // The 广场 tab should be visually active
    expect(screen.getByText("广场")).toBeInTheDocument();
    // SmartInviteCards should be visible
    expect(screen.getAllByTestId("smart-invite-card")).toHaveLength(2);
  });

  test("clicking Leaderboard tab switches view", () => {
    render(
      <SquareLayout
        matches={sampleMatches}
        venueName="Dragon Club"
        players={[]}
      />
    );
    fireEvent.click(screen.getByText("排行榜"));
    expect(screen.getByTestId("venue-leaderboard")).toBeInTheDocument();
    expect(screen.queryAllByTestId("smart-invite-card")).toHaveLength(0);
  });

  test("renders empty state when no matches", () => {
    render(<SquareLayout matches={[]} />);
    expect(screen.getByText("暂无活动邀请")).toBeInTheDocument();
    expect(screen.queryAllByTestId("smart-invite-card")).toHaveLength(0);
  });

  test("sorts plaza matches by distance (nearest first)", () => {
    render(<SquareLayout matches={sampleMatches} />);
    const cards = screen.getAllByTestId("smart-invite-card");
    // Bob (100m) should come before Alice (500m)
    expect(cards[0]).toHaveTextContent("Bob");
    expect(cards[1]).toHaveTextContent("Alice");
  });

  test("renders loading spinner when loading=true", () => {
    render(<SquareLayout matches={[]} loading={true} />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByText("暂无活动邀请")).not.toBeInTheDocument();
  });
});
