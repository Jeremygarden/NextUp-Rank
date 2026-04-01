# Code Review Findings

1. **SmartInviteCard countdown timer re-creates intervals every second**
   - **Severity**: High
   - **Issue**: The `useEffect` that drives the invitation countdown currently depends on `timeLeft`, so it tears down and re-creates a new interval every second. This spawns many overlapping timers, leading to rapid CPU and memory usage while also delaying the transition to the `Expired` state.
   - **Suggested fix**: Keep the timer effect tied only to `status`, clamp `timeLeft` inside the interval, and watch `timeLeft` separately to flip the status when it hits zero. The fix is implemented in this review.

2. **HANDSHAKE_SUCCESS events add duplicate matches instead of updating state**
   - **Severity**: Medium
   - **Issue**: `usePlazaEvents` previously treated every broadcast payload as a new match record, so handshake success broadcasts produce duplicate cards and the UI never sees the `locked` status or `is_lbs_verified` flag. This makes the plaza view inconsistent with real-time updates.
   - **Suggested fix**: Normalize payloads by `match_id`, upsert them into the state array, and merge handshake payloads into the existing match so the status and verification flag stay in sync. The fix is included here to keep downstream components testable.
