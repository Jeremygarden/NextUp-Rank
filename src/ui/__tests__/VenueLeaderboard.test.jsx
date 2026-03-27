import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import VenueLeaderboard from "../VenueLeaderboard";

// Mock recharts
jest.mock("recharts", () => ({
  LineChart: ({ children }) => <svg data-testid="sparkline">{children}</svg>,
  Line: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  YAxis: () => null,
}));

describe("VenueLeaderboard", () => {
  const samplePlayers = [
    {
      id: "u1",
      nickname: "DragonStrike",
      rating: 1620,
      recent_delta: 12.5,
      recent_25_snapshots: [{ rating: 1580 }, { rating: 1600 }, { rating: 1620 }],
    },
    {
      id: "u2",
      nickname: "SilkCue",
      rating: 1540,
      recent_delta: -3.0,
      recent_25_snapshots: [{ rating: 1560 }, { rating: 1550 }, { rating: 1540 }],
    },
  ];

  test("renders player list with rank and rating", () => {
    render(<VenueLeaderboard venueName="Dragon Club" players={samplePlayers} />);
    expect(screen.getByText("DragonStrike")).toBeInTheDocument();
    expect(screen.getByText("SilkCue")).toBeInTheDocument();
    expect(screen.getByText("1620")).toBeInTheDocument();
    expect(screen.getByText("1540")).toBeInTheDocument();
    // rank numbers
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  test("shows positive delta in green (emerald)", () => {
    render(<VenueLeaderboard players={samplePlayers} />);
    const positiveDelta = screen.getByText("+12.5△");
    expect(positiveDelta).toBeInTheDocument();
    expect(positiveDelta).toHaveClass("text-emerald-400");
  });

  test("shows negative delta in red", () => {
    render(<VenueLeaderboard players={samplePlayers} />);
    const negativeDelta = screen.getByText("-3.0▽");
    expect(negativeDelta).toBeInTheDocument();
    expect(negativeDelta).toHaveClass("text-red-400");
  });

  test("renders venueName in header", () => {
    render(<VenueLeaderboard venueName="Golden Break" players={[]} />);
    expect(screen.getByText("Golden Break")).toBeInTheDocument();
  });

  test("renders empty state when no players", () => {
    render(<VenueLeaderboard players={[]} />);
    expect(screen.getByText("暂无数据")).toBeInTheDocument();
  });
});
