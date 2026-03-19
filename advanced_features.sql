-- Advanced Features: LBS Validation, Anti-Farming & Karma Triggers

-- 1. Anti-Farming: Check for excessive repeated matches between same opponents
CREATE OR REPLACE FUNCTION check_anti_farming(player_a UUID, player_b UUID)
RETURNS FLOAT AS $$
DECLARE
    recent_matches_count INTEGER;
    weight_multiplier FLOAT := 1.0;
BEGIN
    -- Count matches between these two in the last 24 hours
    SELECT COUNT(*) INTO recent_matches_count
    FROM matches
    WHERE ((player_a_id = player_a AND player_b_id = player_b) OR (player_a_id = player_b AND player_b_id = player_a))
    AND created_at > NOW() - INTERVAL '24 hours'
    AND status = 'completed';

    -- Exponential decay after 3 matches
    IF recent_matches_count >= 3 THEN
        weight_multiplier := POWER(0.5, recent_matches_count - 2);
    END IF;

    RETURN weight_multiplier;
END;
$$ LANGUAGE plpgsql;

-- 2. LBS & Weight Calculation Trigger
CREATE OR REPLACE FUNCTION process_match_weight()
RETURNS TRIGGER AS $$
DECLARE
    dist_weight FLOAT := 1.0;
    farming_weight FLOAT := 1.0;
BEGIN
    -- Distance Check (LBS)
    -- If distance > 200m or LBS not verified, cut weight by 50%
    IF NEW.distance_meters > 200 OR NEW.is_lbs_verified = FALSE THEN
        dist_weight := 0.5;
    END IF;

    -- Anti-Farming Check
    farming_weight := check_anti_farming(NEW.player_a_id, NEW.player_b_id);

    -- Store final weight in metadata for the rating engine
    NEW.match_metadata = jsonb_set(
        COALESCE(NEW.match_metadata, '{}'::jsonb),
        '{calculated_weight}',
        to_jsonb(dist_weight * farming_weight)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_match_weight_calculation
BEFORE INSERT OR UPDATE OF status ON matches
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION process_match_weight();

-- 3. Karma & Dispute Logic
CREATE OR REPLACE FUNCTION update_karma_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Reward both players for a verified, non-disputed match
    IF NEW.status = 'completed' AND NEW.is_lbs_verified = TRUE THEN
        UPDATE users SET karma_score = LEAST(karma_score + 1, 100)
        WHERE id IN (NEW.player_a_id, NEW.player_b_id);
    END IF;

    -- Heavy penalty for disputes (logic can be expanded to penalize the 'loser' of a dispute)
    IF NEW.status = 'disputed' THEN
        UPDATE users SET karma_score = GREATEST(karma_score - 5, 0)
        WHERE id IN (NEW.player_a_id, NEW.player_b_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_karma_updates
AFTER UPDATE OF status ON matches
FOR EACH ROW
EXECUTE FUNCTION update_karma_on_completion();
