-- =============================================
-- Mon Tajwid — Phase 2 Database Schema
-- =============================================

-- 1. PROFILES (username-based)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferred_reciter TEXT DEFAULT '7',
  is_admin BOOLEAN DEFAULT FALSE,
  streak INTEGER DEFAULT 0,
  last_practice_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. USER PROGRESS
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  surah_id INTEGER NOT NULL CHECK (surah_id BETWEEN 1 AND 114),
  juz_id INTEGER DEFAULT 1,
  is_validated BOOLEAN DEFAULT FALSE,
  best_score REAL DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  bookmark_verse INTEGER,
  last_attempt_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, surah_id)
);
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_select" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_insert" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "progress_update" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- 3. RECITATION ATTEMPTS
CREATE TABLE IF NOT EXISTS recitation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  surah_id INTEGER NOT NULL,
  transcription TEXT,
  tajwid_score REAL DEFAULT 0,
  accuracy_score REAL DEFAULT 0,
  overall_score REAL DEFAULT 0,
  feedback JSONB DEFAULT '{}',
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE recitation_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_select" ON recitation_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert" ON recitation_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. DUELS
CREATE TABLE IF NOT EXISTS duels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  opponent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  surah_id INTEGER NOT NULL CHECK (surah_id BETWEEN 1 AND 114),
  challenger_score REAL,
  opponent_score REAL,
  challenger_time INTEGER,
  opponent_time INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','active','completed','expired')),
  share_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours')
);
ALTER TABLE duels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "duels_select" ON duels FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);
CREATE POLICY "duels_insert" ON duels FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "duels_update" ON duels FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON recitation_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_duels_challenger ON duels(challenger_id);
CREATE INDEX IF NOT EXISTS idx_duels_opponent ON duels(opponent_id);
CREATE INDEX IF NOT EXISTS idx_duels_share ON duels(share_code);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 6. TRIGGER: Auto-create profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, username, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. ADMIN VIEW (for admin dashboard)
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE last_practice_date = CURRENT_DATE) as active_today,
  (SELECT COUNT(*) FROM user_progress WHERE is_validated = true) as total_validations,
  (SELECT COUNT(*) FROM duels) as total_duels,
  (SELECT COUNT(*) FROM recitation_attempts) as total_attempts;
