-- Function to generate daily challenges
-- This should be called by a scheduled job daily

CREATE OR REPLACE FUNCTION generate_daily_challenge()
RETURNS JSONB AS $$
DECLARE
  v_challenge_date DATE;
  v_scenarios JSONB[] := ARRAY[
    jsonb_build_object(
      'title', 'Coffee Shop Confidence',
      'description', 'Practice starting a conversation at a coffee shop',
      'difficulty_level', 2,
      'scenario_prompt', 'You notice someone reading a book you love at a coffee shop. Start a natural conversation.',
      'success_criteria', ARRAY['Made a relevant comment', 'Asked an open question', 'Showed genuine interest'],
      'bonus_tokens', 5
    ),
    jsonb_build_object(
      'title', 'Gym Approach',
      'description', 'Practice respectful gym interactions',
      'difficulty_level', 3,
      'scenario_prompt', 'Someone at the gym asks you about your workout routine. Turn it into a friendly conversation.',
      'success_criteria', ARRAY['Shared helpful information', 'Asked about their goals', 'Kept it appropriate'],
      'bonus_tokens', 7
    ),
    jsonb_build_object(
      'title', 'Online Match Message',
      'description', 'Craft an engaging first message',
      'difficulty_level', 2,
      'scenario_prompt', 'You matched with someone who loves hiking and photography. Send an engaging first message.',
      'success_criteria', ARRAY['Referenced their interests', 'Asked engaging question', 'Showed personality'],
      'bonus_tokens', 5
    ),
    jsonb_build_object(
      'title', 'Group Conversation',
      'description', 'Navigate group dynamics smoothly',
      'difficulty_level', 4,
      'scenario_prompt', 'You are at a party and join a group conversation. Contribute while showing interest in someone specific.',
      'success_criteria', ARRAY['Engaged the whole group', 'Made contributions', 'Created connection opportunities'],
      'bonus_tokens', 8
    ),
    jsonb_build_object(
      'title', 'Rejection Recovery',
      'description', 'Handle rejection with grace',
      'difficulty_level', 5,
      'scenario_prompt', 'Someone politely declines your invitation to coffee. Respond gracefully.',
      'success_criteria', ARRAY['Accepted gracefully', 'Maintained composure', 'Left door open for friendship'],
      'bonus_tokens', 10
    )
  ];
  v_selected_scenario JSONB;
  v_new_challenge_id UUID;
BEGIN
  v_challenge_date := CURRENT_DATE;
  
  -- Check if challenge already exists for today
  IF EXISTS (SELECT 1 FROM public.daily_challenges WHERE challenge_date = v_challenge_date) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Challenge already exists for today');
  END IF;
  
  -- Select a random scenario
  v_selected_scenario := v_scenarios[1 + floor(random() * array_length(v_scenarios, 1))];
  
  -- Create the challenge
  INSERT INTO public.daily_challenges (
    challenge_date,
    title,
    description,
    difficulty_level,
    scenario_prompt,
    success_criteria,
    bonus_tokens,
    is_active
  ) VALUES (
    v_challenge_date,
    v_selected_scenario->>'title',
    v_selected_scenario->>'description',
    (v_selected_scenario->>'difficulty_level')::INTEGER,
    v_selected_scenario->>'scenario_prompt',
    ARRAY(SELECT jsonb_array_elements_text(v_selected_scenario->'success_criteria')),
    (v_selected_scenario->>'bonus_tokens')::INTEGER,
    true
  ) RETURNING id INTO v_new_challenge_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'challenge_id', v_new_challenge_id,
    'challenge_date', v_challenge_date
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a daily challenge
CREATE OR REPLACE FUNCTION complete_daily_challenge(
  p_user_id UUID,
  p_challenge_id UUID,
  p_performance_score INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_challenge RECORD;
  v_tokens_earned INTEGER;
  v_streak RECORD;
  v_yesterday DATE;
BEGIN
  -- Get challenge details
  SELECT * INTO v_challenge
  FROM public.daily_challenges
  WHERE id = p_challenge_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge not found');
  END IF;
  
  -- Check if already completed
  IF EXISTS (
    SELECT 1 FROM public.user_challenge_completions
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id AND completed = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Challenge already completed');
  END IF;
  
  -- Calculate tokens earned
  v_tokens_earned := GREATEST(1, ROUND(v_challenge.bonus_tokens * (p_performance_score::DECIMAL / 100)));
  
  -- Record completion
  INSERT INTO public.user_challenge_completions (
    user_id, challenge_id, completed, performance_score, tokens_earned
  ) VALUES (
    p_user_id, p_challenge_id, true, p_performance_score, v_tokens_earned
  );
  
  -- Grant bonus tokens
  UPDATE public.user_tokens
  SET resettable_tokens = resettable_tokens + v_tokens_earned
  WHERE user_id = p_user_id;
  
  -- Update streak
  v_yesterday := CURRENT_DATE - INTERVAL '1 day';
  
  SELECT * INTO v_streak FROM public.user_streaks WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_completed_date)
    VALUES (p_user_id, 1, 1, CURRENT_DATE);
  ELSIF v_streak.last_completed_date = v_yesterday THEN
    UPDATE public.user_streaks
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_completed_date = CURRENT_DATE
    WHERE user_id = p_user_id;
  ELSE
    UPDATE public.user_streaks
    SET current_streak = 1, last_completed_date = CURRENT_DATE
    WHERE user_id = p_user_id;
  END IF;
  
  -- Record transaction
  INSERT INTO public.token_transactions (
    user_id, transaction_type, amount, token_type, description
  ) VALUES (
    p_user_id, 'bonus', v_tokens_earned, 'resettable', 'Daily challenge completion'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'tokens_earned', v_tokens_earned,
    'new_streak', (SELECT current_streak FROM public.user_streaks WHERE user_id = p_user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 