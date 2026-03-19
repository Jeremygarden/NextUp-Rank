# Billiard-Rank CEO Strategic Plan (BG-1)

## 1. Core Vision
Create a trust-based pool rating ecosystem that solves the "unknown skill level" problem in casual and competitive play. Superior to FargoRate through higher precision and anti-cheating mechanisms.

## 2. Product Roadmap (MVP - Phase D)
- **Math Engine (BG-1)**: Glicko-2 based system with Rack-level Score Adjustment ($S_{adj}$).
- **Event-Sourced Memory**: Store full history + 25-match rolling snapshots for real-time visualization.
- **LBS Handshake**: Location-based match locking to prevent remote "score farming".
- **Venue Leaderboards**: Real-time rankings per pool hall/location.

## 3. Mathematical Principles (BG-1)
- **RD (Rating Deviation)**: Captures uncertainty (higher for new/inactive players).
- **Volatility ($\sigma$)**: Detects rapid improvement/consistency.
- **Rack-Level Accuracy**: A 7:0 win yields higher rating gains than 7:6.

## 4. Engineering Architecture
- **Stack**: Vercel (Frontend), Next.js, Supabase (PostgreSQL + PostGIS).
- **Schema**: `users`, `venues`, `matches`, `rating_snapshots`.

## 5. Next Focus: Location-Based Features
- **Square Mode**: Show top players within 5km/10km or by specific Venue ID.
- **Dynamic Leaderboards**: Filter by "Recent Progress" vs "Absolute Skill".
