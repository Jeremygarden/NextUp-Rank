import { vi } from 'vitest';
import { render, screen, fireEvent, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import SmartInviteCard from "../SmartInviteCard";
import React from "react";

// Mock Lucide icons and Framer Motion to simplify tests
vi.mock("lucide-react", () => ({
  Target: () => <div data-testid="icon-target" />,
  Clock: () => <div data-testid="icon-clock" />,
  Trophy: () => <div data-testid="icon-trophy" />,
  ChevronRight: () => <div data-testid="icon-chevron" />,
  Copy: () => <div data-testid="icon-copy" />,
  Check: () => <div data-testid="icon-check" />,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, className }) => <div className={className}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe("SmartInviteCard", () => {
  const defaultProps = {
    inviter: "Alex",
    gameType: "8ball",
    startTime: "Tonight 20:00",
    entryFee: "Free",
    inviteUrl: "https://test.link",
    expiresInSeconds: 3600,
  };

  test("renders basic match info correctly", () => {
    render(<SmartInviteCard {...defaultProps} />);
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Tonight 20:00")).toBeInTheDocument();
    expect(screen.getByText("Entry: Free")).toBeInTheDocument();
  });

  test("displays correct role badge", () => {
    render(<SmartInviteCard {...defaultProps} role="Admin" />);
    expect(screen.getByText("管理员")).toBeInTheDocument();
  });

  test("switches to Joined layout when status is Joined", () => {
    render(<SmartInviteCard {...defaultProps} status="Joined" />);
    expect(screen.getByText("对局已确认 ✓")).toBeInTheDocument();
    expect(screen.queryByText("接受")).not.toBeInTheDocument();
  });

  test("switches to Expired layout when status is Expired", () => {
    render(<SmartInviteCard {...defaultProps} status="Expired" />);
    expect(screen.getByText("邀请已过期")).toBeInTheDocument();
    expect(screen.getByText("已过期")).toBeInTheDocument();
  });

  test("countdown auto-expires when reaching zero", () => {
    vi.useFakeTimers();
    render(<SmartInviteCard {...defaultProps} expiresInSeconds={1} />);
    
    expect(screen.getByText("0:01")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("邀请已过期")).toBeInTheDocument();
    vi.useRealTimers();
  });

  test("copy button interaction", async () => {
    const mockClipboard = {
      writeText: vi.fn().mockResolvedValue(),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<SmartInviteCard {...defaultProps} />);
    const copyBtn = screen.getByRole("button", { name: /复制/i });
    
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(mockClipboard.writeText).toHaveBeenCalledWith("https://test.link");
    expect(screen.getByText("已复制")).toBeInTheDocument();
  });

  test("shows inviteCode when provided", () => {
    render(<SmartInviteCard {...defaultProps} inviteCode="ABC123" />);
    expect(screen.getByText("#ABC123")).toBeInTheDocument();
  });

  test("hides invite code element when inviteCode not provided", () => {
    render(<SmartInviteCard {...defaultProps} />);
    expect(screen.queryByText(/#/)).not.toBeInTheDocument();
  });
});
