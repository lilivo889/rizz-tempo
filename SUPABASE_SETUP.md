# Supabase Setup Guide

## Quick Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for setup to complete

2. **Get Your Credentials**
   - Go to Settings > API
   - Copy your Project URL and anon/public key

3. **Configure Environment**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Run Database Migrations**
   - Go to your Supabase dashboard
   - Open SQL Editor
   - Copy and paste `sql/migrations/001_initial_setup.sql`
   - Run the SQL
   - Then run `sql/seed_data/conversation_scenarios.sql`

## Usage

```typescript
import { supabase, db } from './lib/supabase';

// Using the db utilities
const profiles = await db.select('profiles');
const newSession = await db.insert('practice_sessions', {
  user_id: userId,
  scenario_type: 'dating',
  confidence_score: 8
});

// Direct Supabase client
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});
```

## Database Schema

- **profiles**: User profile information
- **practice_sessions**: User practice session data
- **conversation_scenarios**: Available practice scenarios
- **user_preferences**: User app preferences

All tables have Row Level Security (RLS) enabled for data protection. 