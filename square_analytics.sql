-- Square Mode: Venue-based Analytics and Leaderboards

-- 1. King of the Hill (球馆霸主)
-- Calculates the player with the highest rating gain in a specific venue over the last 7 days.
-- Requirement: Must have played at least 3 matches in this venue during the period.

CREATE OR REPLACE FUNCTION get_venue_king_of_the_hill(target_venue_id UUID, days_interval INTEGER DEFAULT 7)
RETURNS TABLE (
    player_id UUID,
    nickname TEXT,
    rating_gain FLOAT,
    match_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH venue_stats AS (
        SELECT 
            s.user_id,
            u.nickname,
            SUM(s.rating_delta) as total_gain,
            COUNT(s.id) as games_played
        FROM rating_snapshots s
        JOIN matches m ON s.match_id = m.id
        JOIN users u ON s.user_id = u.id
        WHERE m.venue_id = target_venue_id
          AND m.status = 'completed'
          AND m.created_at > NOW() - (days_interval || ' days')::INTERVAL
        GROUP BY s.user_id, u.nickname
        HAVING COUNT(s.id) >= 3 -- Minimum activity threshold
    )
    SELECT * FROM venue_stats
    ORDER BY total_gain DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 2. Local Discovery (附近的高手)
-- Finds top players within a certain radius of a point.
-- Uses PostGIS ST_DWithin for efficiency.

CREATE OR REPLACE FUNCTION get_nearby_top_players(lat FLOAT, lon FLOAT, radius_meters FLOAT DEFAULT 5000)
RETURNS TABLE (
    player_id UUID,
    nickname TEXT,
    current_rating FLOAT,
    distance_meters FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.nickname,
        u.rating,
        ST_Distance(u.last_location, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography) as dist
    FROM users u
    WHERE ST_DWithin(u.last_location, ST_SetSRID(ST_MakePoint(lon, lat), 4326)::geography, radius_meters)
    ORDER BY u.rating DESC, dist ASC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- 3. Sniper Detection (狙击手榜单)
-- Identifies low-rated players who recently won against significantly higher-rated opponents at a venue.

CREATE OR REPLACE VIEW view_venue_snipers AS
SELECT 
    m.venue_id,
    u.id as sniper_id,
    u.nickname as sniper_name,
    m.racks_won || ':' || m.racks_lost as score,
    s.rating_delta,
    s.opponent_rating_at_match - s.rating_before as upset_diff,
    m.created_at
FROM matches m
JOIN rating_snapshots s ON m.id = s.match_id
JOIN users u ON s.user_id = u.id
WHERE s.rating_delta > 0 
  AND (s.opponent_rating_at_match - s.rating_before) > 100 -- Upset threshold
  AND m.status = 'completed'
  AND m.created_at > NOW() - INTERVAL '30 days';
