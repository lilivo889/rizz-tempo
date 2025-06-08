-- Initial setup for Rizz Tempo app
-- Run this in your Supabase SQL editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" = 'your-jwt-secret-here';

-- Create users profile table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username VARCHAR(50) UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  age INTEGER,
  bio TEXT,
  location TEXT,
  interests TEXT[],
  looking_for TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Create practice sessions table
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scenario_type TEXT NOT NULL,
  duration_seconds INTEGER,
  confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 10),
  feedback TEXT,
  audio_url TEXT,
  transcription TEXT
);

-- Create conversation scenarios table
CREATE TABLE IF NOT EXISTS public.conversation_scenarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
  category TEXT,
  prompt TEXT NOT NULL,
  expected_responses TEXT[],
  tips TEXT[]
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  preferred_scenarios TEXT[],
  difficulty_preference INTEGER DEFAULT 3,
  session_length_minutes INTEGER DEFAULT 5,
  notifications_enabled BOOLEAN DEFAULT true,
  practice_reminders BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for practice sessions
CREATE POLICY "Users can view their own practice sessions" ON public.practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice sessions" ON public.practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice sessions" ON public.practice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policies for user preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for conversation scenarios
CREATE POLICY "Anyone can view conversation scenarios" ON public.conversation_scenarios
  FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 