# INTERFACE.md - Project NextUp-Rank API & Data Contract

This document serves as the **Single Source of Truth** for Frontend (UI Agent) and Backend (Backend Agent). Any changes to fields or types must be updated here first.

## 1. Core Data Models (Postgres/Supabase)

### `users`
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `nickname` | TEXT | Display name |
| `rating` | FLOAT | Glicko-2 rating (Default: 1500) |
| `rd` | FLOAT | Rating Deviation (Uncertainty) |
| `vol` | FLOAT | Volatility (Stability) |
| `recent_25_snapshots` | JSONB | Cache for profile chart display |
| `last_location` | GEOGRAPHY(POINT) | Last known LBS position |

### `venues` (The Square Locations)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `name` | TEXT | Pool Hall Name |
| `geo_location` | GEOGRAPHY(POINT) | Fixed location of the venue |

### `matches` (Handshake & State)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `player_a_id` | UUID | Creator of the invite |
| `player_b_id` | UUID | Accepted player |
| `status` | TEXT | `pending`, `locked`, `completed`, `disputed` |
| `venue_id` | UUID | Linked location |
| `is_lbs_verified` | BOOLEAN | If distance was < 100m during handshake |

---

## 2. Realtime Channels (Supabase Broadcast)

### Channel: `plaza_events`
Broadcasts live events on the Square.
- **Event: `MATCH_CREATED`**
  - Data: `{ match_id, player_name, rating, venue_name }`
- **Event: `HANDSHAKE_SUCCESS`**
  - Data: `{ match_id, player_a_name, player_b_name, status: 'locked' }`

### Channel: `leaderboard_updates`
- **Event: `RANK_CHANGE`**
  - Data: `{ user_id, old_rank, new_rank, delta }`

---

## 3. API Endpoints (Edge Functions / Serverless)

### `POST /api/match/handshake`
- **Request**: `{ match_id, invite_code, player_b_id, current_location }`
- **Logic**:
  1. Verify `invite_code`.
  2. Calculate distance between `current_location` and `matches.venue_id`.
  3. Update `status` to `locked`.
  4. Set `is_lbs_verified = true` if distance < 100m.

### `GET /api/leaderboard?venue_id=...`
- **Response**: `Array<{ rank, nickname, rating, recent_delta }>`

---

## 4. UI Component Mappings

### `SmartInviteCard` (Props)
- `status`: Mapped to `matches.status`
- `roles`: Mapped to project defined ROLES
- `location`: Mapped to `venues.name`
- `countdown`: Logic derived from `matches.created_at + 15 mins`
