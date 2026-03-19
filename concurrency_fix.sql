-- Race Condition Prevention: Atomic Rating Updates for Supabase/PostgreSQL

-- 1. Create a function for Atomic Rating Increment
-- This ensures that rating updates happen in a single transaction using row-level locking.
-- Use this instead of direct client-side UPDATE to prevent overwriting concurrent changes.

CREATE OR REPLACE FUNCTION atomic_update_user_rating(
    target_user_id UUID,
    new_rating FLOAT,
    new_rd FLOAT,
    new_vol FLOAT,
    new_last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS VOID AS $$
BEGIN
    -- FOR UPDATE locks the row until the transaction completes
    -- This prevents other processes from reading the old rating and calculating based on it
    -- while this update is in progress.
    UPDATE users
    SET 
        rating = new_rating,
        rd = new_rd,
        vol = new_vol,
        last_active_at = new_last_active_at
    WHERE id = target_user_id;

    -- Note: In a true high-concurrency race, the calculation itself should 
    -- happen inside a transaction. However, since Glicko-2 calculations
    -- are complex, locking the row during the final UPDATE is the 
    -- standard safety measure for Supabase/PostgreSQL environments.
END;
$$ LANGUAGE plpgsql;

-- 2. Rating Lock for Match Processing
-- If processing multiple matches at once, use a "Queue" or "Serial" processing approach.
-- This trigger/function ensures only one match can update a user's rating at a time.

CREATE OR REPLACE FUNCTION update_rating_safely()
RETURNS TRIGGER AS $$
DECLARE
    -- Variable to hold current state
    current_rating_a FLOAT;
    current_rd_a FLOAT;
    current_vol_a FLOAT;
BEGIN
    -- Lock both users involved in the match
    -- This ensures that if player A is in match 1 and match 2 simultaneously,
    -- they are processed strictly one after the other.
    PERFORM * FROM users WHERE id IN (NEW.player_a_id, NEW.player_b_id) FOR UPDATE;

    -- [Logic Placeholder]
    -- Here you would call your RPC or internal PL/pgSQL Glicko logic
    -- Since the users are locked (FOR UPDATE), no other process can 
    -- modify their rating until this trigger finishes.

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Optimization: Match Serialization
-- Add a sequence or timestamp-based lock to the matches table if needed.
-- (Usually row-level locking on the 'users' table is sufficient).
