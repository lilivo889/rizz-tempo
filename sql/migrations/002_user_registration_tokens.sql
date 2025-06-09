-- User Registration & Token Management Migration
-- Run this after 001_initial_setup.sql

-- Add columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS device_fingerprints TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phone_number TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auth_providers TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_level TEXT,
ADD COLUMN IF NOT EXISTS dating_goals TEXT[],
ADD COLUMN IF NOT EXISTS preferred_contexts TEXT[],
ADD COLUMN IF NOT EXISTS communication_style TEXT;

-- Add constraint for experience level
ALTER TABLE public.profiles 
ADD CONSTRAINT check_experience_level 
CHECK (experience_level IN ('beginner', 'intermediate', 'advanced') OR experience_level IS NULL);

-- Create token management table
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  permanent_tokens DECIMAL(10,5) DEFAULT 0,
  resettable_tokens DECIMAL(10,5) DEFAULT 0,
  free_tokens_claimed BOOLEAN DEFAULT false,
  total_consumed DECIMAL(10,5) DEFAULT 0,
  last_consumption_at TIMESTAMP WITH TIME ZONE
);

-- Create device tracking table
CREATE TABLE IF NOT EXISTS public.device_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_fingerprint TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  first_user_id UUID REFERENCES public.profiles(id),
  free_tokens_claimed BOOLEAN DEFAULT false,
  total_accounts_created INTEGER DEFAULT 1
);

-- Create subscription management table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  plan_type TEXT,
  status TEXT DEFAULT 'pending',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  next_reset_date TIMESTAMP WITH TIME ZONE,
  tokens_per_period INTEGER,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT
);

-- Add constraints for subscriptions
ALTER TABLE public.subscriptions
ADD CONSTRAINT check_plan_type CHECK (plan_type IN ('weekly', 'monthly', 'quarterly', 'biannual')),
ADD CONSTRAINT check_status CHECK (status IN ('active', 'cancelled', 'expired', 'pending'));

-- Create token transactions table
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transaction_type TEXT NOT NULL,
  amount DECIMAL(10,5) NOT NULL,
  token_type TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Add constraints for token transactions
ALTER TABLE public.token_transactions
ADD CONSTRAINT check_transaction_type CHECK (transaction_type IN ('purchase', 'subscription_reset', 'consumption', 'bonus', 'refund', 'registration_bonus')),
ADD CONSTRAINT check_token_type CHECK (token_type IN ('permanent', 'resettable') OR token_type IS NULL);

-- Create daily challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  challenge_date DATE UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  scenario_prompt TEXT NOT NULL,
  success_criteria TEXT[],
  bonus_tokens INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true
);

-- Create user challenge completions
CREATE TABLE IF NOT EXISTS public.user_challenge_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT false,
  performance_score INTEGER CHECK (performance_score >= 0 AND performance_score <= 100),
  tokens_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);

-- Create user streaks table
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own tokens" ON public.user_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.user_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON public.token_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active challenges" ON public.daily_challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view own completions" ON public.user_challenge_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON public.user_challenge_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own streaks" ON public.user_streaks
  FOR SELECT USING (auth.uid() = user_id);

-- Functions for token management
CREATE OR REPLACE FUNCTION consume_tokens(
  p_user_id UUID,
  p_seconds DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_consumption DECIMAL;
  v_user_tokens RECORD;
  v_remaining_consumption DECIMAL;
  v_result JSONB;
BEGIN
  -- Calculate consumption (0.02778 tokens per second)
  v_consumption := p_seconds * 0.02778;
  
  -- Get current token balances
  SELECT * INTO v_user_tokens FROM public.user_tokens WHERE user_id = p_user_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User tokens not found');
  END IF;
  
  v_remaining_consumption := v_consumption;
  
  -- First consume from resettable tokens
  IF v_user_tokens.resettable_tokens > 0 THEN
    IF v_user_tokens.resettable_tokens >= v_remaining_consumption THEN
      UPDATE public.user_tokens 
      SET resettable_tokens = resettable_tokens - v_remaining_consumption,
          total_consumed = total_consumed + v_remaining_consumption,
          last_consumption_at = NOW()
      WHERE user_id = p_user_id;
      v_remaining_consumption := 0;
    ELSE
      v_remaining_consumption := v_remaining_consumption - v_user_tokens.resettable_tokens;
      UPDATE public.user_tokens 
      SET resettable_tokens = 0,
          total_consumed = total_consumed + v_user_tokens.resettable_tokens,
          last_consumption_at = NOW()
      WHERE user_id = p_user_id;
    END IF;
  END IF;
  
  -- Then consume from permanent tokens if needed
  IF v_remaining_consumption > 0 AND v_user_tokens.permanent_tokens >= v_remaining_consumption THEN
    UPDATE public.user_tokens 
    SET permanent_tokens = permanent_tokens - v_remaining_consumption,
        total_consumed = total_consumed + v_remaining_consumption,
        last_consumption_at = NOW()
    WHERE user_id = p_user_id;
    v_remaining_consumption := 0;
  ELSIF v_remaining_consumption > 0 THEN
    -- Not enough tokens
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient tokens');
  END IF;
  
  -- Record transaction
  INSERT INTO public.token_transactions (user_id, transaction_type, amount, description)
  VALUES (p_user_id, 'consumption', -v_consumption, 'Voice practice session');
  
  -- Return updated balances
  SELECT permanent_tokens, resettable_tokens 
  INTO v_result 
  FROM public.user_tokens 
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'success', true, 
    'consumed', v_consumption,
    'permanent_tokens', (v_result->>'permanent_tokens')::DECIMAL,
    'resettable_tokens', (v_result->>'resettable_tokens')::DECIMAL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset subscription tokens
CREATE OR REPLACE FUNCTION reset_subscription_tokens()
RETURNS void AS $$
DECLARE
  v_subscription RECORD;
BEGIN
  FOR v_subscription IN 
    SELECT s.*, ut.user_id 
    FROM public.subscriptions s
    JOIN public.user_tokens ut ON ut.user_id = s.user_id
    WHERE s.status = 'active' 
    AND s.next_reset_date <= NOW()
  LOOP
    -- Reset tokens
    UPDATE public.user_tokens
    SET resettable_tokens = v_subscription.tokens_per_period,
        updated_at = NOW()
    WHERE user_id = v_subscription.user_id;
    
    -- Record transaction
    INSERT INTO public.token_transactions (
      user_id, transaction_type, amount, token_type, description
    ) VALUES (
      v_subscription.user_id, 'subscription_reset', 
      v_subscription.tokens_per_period, 'resettable',
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
      updated_at = NOW()
    WHERE id = v_subscription.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 