-- Token Management Functions
-- Run this after 002_user_registration_tokens.sql

-- Function to consume tokens during practice sessions
CREATE OR REPLACE FUNCTION consume_tokens(
  p_user_id UUID,
  p_seconds DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_consumption DECIMAL;
  v_user_tokens RECORD;
  v_remaining DECIMAL;
BEGIN
  -- Calculate consumption (0.02778 tokens per second)
  v_consumption := p_seconds * 0.02778;
  
  -- Get current token balances
  SELECT * INTO v_user_tokens 
  FROM public.user_tokens 
  WHERE user_id = p_user_id 
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User tokens not found');
  END IF;
  
  v_remaining := v_consumption;
  
  -- First consume from resettable tokens
  IF v_user_tokens.resettable_tokens > 0 AND v_remaining > 0 THEN
    IF v_user_tokens.resettable_tokens >= v_remaining THEN
      UPDATE public.user_tokens 
      SET resettable_tokens = resettable_tokens - v_remaining,
          total_consumed = total_consumed + v_remaining,
          last_consumption_at = NOW()
      WHERE user_id = p_user_id;
      v_remaining := 0;
    ELSE
      v_remaining := v_remaining - v_user_tokens.resettable_tokens;
      UPDATE public.user_tokens 
      SET resettable_tokens = 0,
          total_consumed = total_consumed + v_user_tokens.resettable_tokens,
          last_consumption_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  END IF;
  
  -- Then consume from permanent tokens
  IF v_remaining > 0 THEN
    IF v_user_tokens.permanent_tokens >= v_remaining THEN
      UPDATE public.user_tokens 
      SET permanent_tokens = permanent_tokens - v_remaining,
          total_consumed = total_consumed + v_remaining,
          last_consumption_at = NOW()
      WHERE user_id = p_user_id;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient tokens');
    END IF;
  END IF;
  
  -- Record transaction
  INSERT INTO public.token_transactions (user_id, transaction_type, amount, description)
  VALUES (p_user_id, 'consumption', -v_consumption, 'Voice practice session');
  
  -- Return updated balances
  SELECT permanent_tokens, resettable_tokens INTO v_user_tokens
  FROM public.user_tokens WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'consumed', v_consumption,
    'permanent_tokens', v_user_tokens.permanent_tokens,
    'resettable_tokens', v_user_tokens.resettable_tokens
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant registration bonus
CREATE OR REPLACE FUNCTION grant_registration_bonus(
  p_user_id UUID,
  p_device_fingerprint TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_device RECORD;
BEGIN
  -- Check device registry
  SELECT * INTO v_device FROM public.device_registry 
  WHERE device_fingerprint = p_device_fingerprint;
  
  IF FOUND AND v_device.free_tokens_claimed THEN
    RETURN jsonb_build_object('success', false, 'error', 'Free tokens already claimed on this device');
  END IF;
  
  -- Register device if new
  IF NOT FOUND THEN
    INSERT INTO public.device_registry (device_fingerprint, first_user_id, free_tokens_claimed)
    VALUES (p_device_fingerprint, p_user_id, true);
  ELSE
    UPDATE public.device_registry
    SET free_tokens_claimed = true, total_accounts_created = total_accounts_created + 1
    WHERE device_fingerprint = p_device_fingerprint;
  END IF;
  
  -- Grant tokens
  INSERT INTO public.user_tokens (user_id, resettable_tokens, free_tokens_claimed)
  VALUES (p_user_id, 6.0, true)
  ON CONFLICT (user_id) DO UPDATE
  SET resettable_tokens = user_tokens.resettable_tokens + 6.0,
      free_tokens_claimed = true;
  
  -- Record transaction
  INSERT INTO public.token_transactions (user_id, transaction_type, amount, token_type, description)
  VALUES (p_user_id, 'registration_bonus', 6.0, 'resettable', 'Welcome bonus - 6 free tokens');
  
  -- Update profile device fingerprints
  UPDATE public.profiles
  SET device_fingerprints = array_append(device_fingerprints, p_device_fingerprint)
  WHERE id = p_user_id;
  
  RETURN jsonb_build_object('success', true, 'tokens_granted', 6.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to purchase permanent tokens
CREATE OR REPLACE FUNCTION purchase_tokens(
  p_user_id UUID,
  p_amount DECIMAL,
  p_payment_id TEXT
)
RETURNS JSONB AS $$
BEGIN
  -- Update user tokens
  UPDATE public.user_tokens
  SET permanent_tokens = permanent_tokens + p_amount,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- If no row exists, create one
  IF NOT FOUND THEN
    INSERT INTO public.user_tokens (
      user_id,
      permanent_tokens
    ) VALUES (
      p_user_id,
      p_amount
    );
  END IF;
  
  -- Record transaction
  INSERT INTO public.token_transactions (
    user_id,
    transaction_type,
    amount,
    token_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    'purchase',
    p_amount,
    'permanent',
    'One-time token purchase',
    jsonb_build_object('payment_id', p_payment_id)
  );
  
  -- Get updated balance
  SELECT permanent_tokens, resettable_tokens
  INTO p_amount
  FROM public.user_tokens
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'tokens_purchased', p_amount,
    'new_balance', (
      SELECT permanent_tokens + resettable_tokens 
      FROM public.user_tokens 
      WHERE user_id = p_user_id
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to activate subscription
CREATE OR REPLACE FUNCTION activate_subscription(
  p_user_id UUID,
  p_plan_type TEXT,
  p_stripe_subscription_id TEXT,
  p_stripe_customer_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_tokens_per_period INTEGER;
  v_period_interval INTERVAL;
BEGIN
  -- Determine tokens and period based on plan
  CASE p_plan_type
    WHEN 'weekly' THEN
      v_tokens_per_period := 50;
      v_period_interval := INTERVAL '7 days';
    WHEN 'monthly' THEN
      v_tokens_per_period := 200;
      v_period_interval := INTERVAL '1 month';
    WHEN 'quarterly' THEN
      v_tokens_per_period := 600;
      v_period_interval := INTERVAL '3 months';
    WHEN 'biannual' THEN
      v_tokens_per_period := 1200;
      v_period_interval := INTERVAL '6 months';
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid plan type'
      );
  END CASE;
  
  -- Create or update subscription
  INSERT INTO public.subscriptions (
    user_id,
    plan_type,
    status,
    current_period_start,
    current_period_end,
    next_reset_date,
    tokens_per_period,
    stripe_subscription_id,
    stripe_customer_id
  ) VALUES (
    p_user_id,
    p_plan_type,
    'active',
    NOW(),
    NOW() + v_period_interval,
    NOW() + v_period_interval,
    v_tokens_per_period,
    p_stripe_subscription_id,
    p_stripe_customer_id
  )
  ON CONFLICT (user_id) DO UPDATE
  SET plan_type = p_plan_type,
      status = 'active',
      current_period_start = NOW(),
      current_period_end = NOW() + v_period_interval,
      next_reset_date = NOW() + v_period_interval,
      tokens_per_period = v_tokens_per_period,
      stripe_subscription_id = p_stripe_subscription_id,
      stripe_customer_id = p_stripe_customer_id,
      updated_at = NOW();
  
  -- Grant initial tokens
  UPDATE public.user_tokens
  SET resettable_tokens = resettable_tokens + v_tokens_per_period,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO public.token_transactions (
    user_id,
    transaction_type,
    amount,
    token_type,
    description
  ) VALUES (
    p_user_id,
    'subscription_reset',
    v_tokens_per_period,
    'resettable',
    'Initial tokens for ' || p_plan_type || ' subscription'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'plan_type', p_plan_type,
    'tokens_granted', v_tokens_per_period
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset subscription tokens (run periodically)
CREATE OR REPLACE FUNCTION reset_subscription_tokens()
RETURNS INTEGER AS $$
DECLARE
  v_subscription RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_subscription IN 
    SELECT s.*, ut.user_id 
    FROM public.subscriptions s
    JOIN public.user_tokens ut ON ut.user_id = s.user_id
    WHERE s.status = 'active' 
    AND s.next_reset_date <= NOW()
  LOOP
    -- Reset tokens to subscription amount
    UPDATE public.user_tokens
    SET resettable_tokens = v_subscription.tokens_per_period,
        updated_at = NOW()
    WHERE user_id = v_subscription.user_id;
    
    -- Record transaction
    INSERT INTO public.token_transactions (
      user_id, 
      transaction_type, 
      amount, 
      token_type, 
      description
    ) VALUES (
      v_subscription.user_id, 
      'subscription_reset', 
      v_subscription.tokens_per_period, 
      'resettable',
      'Subscription token reset for ' || v_subscription.plan_type || ' plan'
    );
    
    -- Update next reset date
    UPDATE public.subscriptions
    SET next_reset_date = 
      CASE plan_type
        WHEN 'weekly' THEN next_reset_date + INTERVAL '7 days'
        WHEN 'monthly' THEN next_reset_date + INTERVAL '1 month'
        WHEN 'quarterly' THEN next_reset_date + INTERVAL '3 months'
        WHEN 'biannual' THEN next_reset_date + INTERVAL '6 months'
      END,
      current_period_start = NOW(),
      current_period_end = 
      CASE plan_type
        WHEN 'weekly' THEN NOW() + INTERVAL '7 days'
        WHEN 'monthly' THEN NOW() + INTERVAL '1 month'
        WHEN 'quarterly' THEN NOW() + INTERVAL '3 months'
        WHEN 'biannual' THEN NOW() + INTERVAL '6 months'
      END,
      updated_at = NOW()
    WHERE id = v_subscription.id;
    
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 