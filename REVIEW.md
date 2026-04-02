# NextUp-Rank — Bug Review Log

## 2026-04-02 — Engineering & Design Review Fixes

### Overview

Full review cycle completed today. Two parallel reviews were run:
- `/plan-eng-review` — 12 issues found, 4 critical gaps (commit `141e66a`)
- `/plan-design-review` — initial score 5/10 → 7/10, 8 unresolved decisions (commit `141e66a`)

All P0/P1 bugs identified and fixed. Summary below.

---

## P0 Bugs (Data Integrity / Silent Failures)

### P0-1 — Player B rating never updated
**File:** `supabase/functions/process-match/index.ts`  
**Root cause:** `atomic_update_user_rating` was only called for `player_a`. Player B's Glicko-2 calculation was never run, so every match silently updated only one side of the rating.  
**Fix:** After computing `player_a` result, compute `player_b` result with racks swapped (`racks_won ↔ racks_lost`, opponent = player_a), then call `atomic_update_user_rating` for player_b.  
**Commit:** `5d3cbdb`

---

### P0-2 — racks_won / racks_lost always 0
**File:** `supabase/functions/process-match/index.ts`  
**Root cause:** `req.json()` only destructured `match_id`. The actual rack scores sent by the frontend (`racks_won`, `racks_lost`) were discarded. Rating calculation used `matchData.racks_won` from DB, which was always 0 (set at match creation).  
**Fix:** Destructure `racks_won` and `racks_lost` from `req.json()`, use them as the authoritative values (with DB fallback), and write them back to the `matches` row.  
**Commit:** `5d3cbdb`

---

### P0-3 — rating_snapshots never written (p_match_id silently ignored)
**File:** `concurrency_fix.sql` — `atomic_update_user_rating` function  
**Root cause:** The Edge Function called `.rpc('atomic_update_user_rating', { ..., p_match_id, p_rating_before, ... })` but the DB function signature only had `(target_user_id, new_rating, new_rd, new_vol, new_last_active_at)`. PostgreSQL silently ignored unknown named parameters in some configurations, so `rating_snapshots` was never populated — the entire match history / profile graph had no data.  
**Why it wasn't caught earlier:** The DB function and Edge Function were written in separate contexts (SQL file vs TypeScript file) with no cross-layer type checking. The mismatch was only visible by comparing both files simultaneously.  
**Fix:** Added `p_match_id UUID DEFAULT NULL`, `p_rating_before FLOAT DEFAULT NULL`, `p_opponent_id UUID DEFAULT NULL`, `p_opponent_rating FLOAT DEFAULT NULL` to the DB function. When `p_match_id` is provided, an `INSERT INTO rating_snapshots` is executed atomically within the same transaction.  
**Commit:** `542fa18`

---

### P0-4 — plaza_events realtime never triggered
**Files:** `supabase/functions/create-match/index.ts`, `supabase/functions/match-handshake/index.ts`  
**Root cause:** Both functions wrote to the DB but never called `supabase.channel('plaza_events').send(...)`. The frontend subscribed to this channel but would never receive any events — the Plaza real-time feed was permanently empty.  
**Fix:** Added broadcast calls after successful DB writes:
- `create-match` → broadcasts `MATCH_CREATED`
- `match-handshake` → broadcasts `HANDSHAKE_SUCCESS`  
**Commit:** `66cfd39`

---

## P1 Bugs (Security / Broken Features)

### P1-1 — No CORS headers on any Edge Function
**Files:** All 4 Edge Functions (`create-match`, `match-handshake`, `process-match`, `leaderboard`)  
**Root cause:** Every `Response` was returned without `Access-Control-Allow-Origin`. All browser requests from the Vercel frontend (cross-origin) were being blocked. OPTIONS preflight returned 404.  
**Fix:** Added `corsHeaders` constant to all 4 functions. All `Response` objects now spread `...corsHeaders`. Each function handles `OPTIONS` preflight with `204`.  
**Commit:** `1de96a2`

---

### P1-2 — Leaderboard endpoint unauthenticated
**File:** `supabase/functions/leaderboard/index.ts`  
**Root cause:** Function used `SUPABASE_SERVICE_ROLE_KEY` with no JWT validation. Anyone could call the endpoint anonymously and get the full rating database.  
**Fix:** Added JWT validation via user-scoped Supabase client. Requests without a valid `Authorization` header return `401`.  
**Commit:** `1de96a2`

---

### P1-3 — SmartInviteCard timer re-creates interval every second
**File:** `src/ui/SmartInviteCard.jsx`  
**Root cause:** `useEffect` had `timeLeft` in its dependency array. Every second the countdown ticked, the effect tore down and re-created the interval, spawning overlapping timers. This caused CPU/memory growth and broke the `Expired` state transition.  
**Fix:** Timer effect now only depends on `currentStatus`. A separate `useEffect` watches `timeLeft === 0` to flip status. Added immediate-expired guard for `expiresInSeconds <= 0`.  
**Commit:** `0b473bf`

---

### P1-4 — HANDSHAKE_SUCCESS broadcasts produce duplicate Plaza cards
**File:** `src/hooks/usePlazaEvents.js`  
**Root cause:** Every broadcast payload was appended as a new match record. `HANDSHAKE_SUCCESS` events created a second card instead of updating the existing one. The `locked` status and `is_lbs_verified` flag were never reflected in the UI.  
**Fix:** Payloads are now upserted by `match_id`. Handshake payloads are merged into the existing match record. Added guard to drop payloads with missing `match_id`.  
**Commit:** `0df8af1`

---

### P1-5 — process-match vulnerable to concurrent double-scoring
**File:** `supabase/functions/process-match/index.ts`  
**Root cause:** No atomic lock before rating calculation. Two concurrent calls for the same `match_id` could both pass the match lookup, run Glicko-2, and double-update both players' ratings.  
**Fix:** Atomic status flip: `UPDATE matches SET status='processing' WHERE id=? AND status='locked' RETURNING id`. If no row returned, the call exits with `409 Conflict`.  
**Commit:** `0062037`

---

### P1-6 — LBS threshold inconsistency (200m vs 100m)
**File:** `advanced_features.sql`  
**Root cause:** The SQL trigger used `200m` while `INTERFACE.md`, `match-handshake`, and all documentation specified `100m`.  
**Fix:** Changed `distance_meters > 200` to `distance_meters > 100` in the trigger and updated the comment.  
**Commit:** `1de96a2`

---

## Known Issues / Not Yet Fixed

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 8 | Python (`math_service.py`) and TypeScript (`mockCalculateRating`) Glicko-2 implementations have no numerical parity tests | Medium | Not blocking. TODO: add integration test that runs same inputs through both and asserts results match within tolerance. |
| — | `lock_and_get_match_data` RPC not defined in any SQL migration | Medium | `process-match` handles the missing RPC gracefully (returns 501 with migration hint). Needs actual SQL migration to unlock full flow. |

---

## Commits Reference

| Commit | Summary |
|--------|---------|
| `0b473bf` | SmartInviteCard timer fix + expiresInSeconds=0 guard |
| `0df8af1` | usePlazaEvents: upsert by match_id, drop ghost records |
| `a3d7988` | useLeaderboard: derive URL from env instead of hardcoded ref |
| `0062037` | process-match: atomic concurrency lock (409 on double-call) + graceful RPC-missing error |
| `5d3cbdb` | process-match: read racks from request body + update player_b rating |
| `66cfd39` | create-match + match-handshake: broadcast plaza_events after DB write |
| `1de96a2` | CORS headers on all Edge Functions + leaderboard auth guard + LBS 100m |
| `542fa18` | atomic_update_user_rating: add p_match_id param + write rating_snapshots |
| `66bf909` | Remove agent internal files from repo, add to .gitignore |
