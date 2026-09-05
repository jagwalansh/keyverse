-- Enrich save_user_score to return previous_score when the user beats their existing score
CREATE OR REPLACE FUNCTION public.save_user_score(
  p_user_id UUID,
  p_song_id TEXT,
  p_score INTEGER,
  p_accuracy NUMERIC,
  p_consistency NUMERIC
)
RETURNS JSONB AS $$
DECLARE
  v_existing_id UUID;
  v_existing_score INTEGER;
  v_count INTEGER;
  v_min_score INTEGER;
  v_min_id UUID;
  v_result JSONB;
BEGIN
  IF p_score <= 0 THEN
    RAISE EXCEPTION 'Inactive or incomplete rounds are not eligible for the leaderboard';
  END IF;

  -- 1. Check if this user already has a score for this song
  SELECT id, score INTO v_existing_id, v_existing_score
  FROM public.scores
  WHERE user_id = p_user_id AND song_id = p_song_id
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    -- If they have an existing score, and the new score is better, update it
    IF p_score > v_existing_score THEN
      UPDATE public.scores
      SET score = p_score,
          accuracy = p_accuracy,
          consistency = p_consistency,
          created_at = NOW()
      WHERE id = v_existing_id;
      
      v_result := jsonb_build_object(
        'status', 'updated',
        'score', p_score,
        'previous_score', v_existing_score
      );
    ELSE
      v_result := jsonb_build_object(
        'status', 'not_better',
        'score', v_existing_score,
        'previous_score', v_existing_score
      );
    END IF;
  ELSE
    -- 2. If they don't have an existing score, check if the leaderboard is full (50 scores)
    SELECT COUNT(*) INTO v_count
    FROM public.scores
    WHERE song_id = p_song_id;

    IF v_count < 50 THEN
      -- If fewer than 50, just insert
      INSERT INTO public.scores (user_id, song_id, score, accuracy, consistency)
      VALUES (p_user_id, p_song_id, p_score, p_accuracy, p_consistency);
      
      v_result := jsonb_build_object('status', 'inserted', 'score', p_score);
    ELSE
      -- Find the lowest score in the top 50
      SELECT id, score INTO v_min_id, v_min_score
      FROM public.scores
      WHERE song_id = p_song_id
      ORDER BY score DESC, created_at ASC
      OFFSET 49
      LIMIT 1;

      -- If the new score is better than the 50th score, insert it and delete the old 50th score (or any scores below top 50)
      IF p_score > v_min_score THEN
        -- Insert the new score
        INSERT INTO public.scores (user_id, song_id, score, accuracy, consistency)
        VALUES (p_user_id, p_song_id, p_score, p_accuracy, p_consistency);

        -- Delete scores that are outside the top 50 for this song
        DELETE FROM public.scores
        WHERE id IN (
          SELECT id
          FROM public.scores
          WHERE song_id = p_song_id
          ORDER BY score DESC, created_at ASC
          OFFSET 50
        );

        v_result := jsonb_build_object('status', 'inserted_and_pruned', 'score', p_score);
      ELSE
        v_result := jsonb_build_object('status', 'not_in_top_50', 'score', p_score);
      END IF;
    END IF;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permissions (idempotent)
GRANT EXECUTE ON FUNCTION public.save_user_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_user_score TO service_role;
