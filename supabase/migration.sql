-- =============================================
-- Mon Tajwid — Database Schema (Supabase)
-- Execute dans Supabase > SQL Editor
-- =============================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferred_reciter TEXT DEFAULT 'mishary_alafasy',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. USER PROGRESS (par sourate)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  surah_id INTEGER NOT NULL CHECK (surah_id BETWEEN 1 AND 114),
  juz_id INTEGER NOT NULL CHECK (juz_id BETWEEN 1 AND 30),
  is_validated BOOLEAN DEFAULT FALSE,
  best_score REAL DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, surah_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- 3. JUZ PROGRESS
CREATE TABLE IF NOT EXISTS juz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  juz_id INTEGER NOT NULL CHECK (juz_id BETWEEN 1 AND 30),
  is_unlocked BOOLEAN DEFAULT FALSE,
  is_completed BOOLEAN DEFAULT FALSE,
  trophy_earned BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, juz_id)
);

ALTER TABLE juz_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own juz progress" ON juz_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own juz progress" ON juz_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own juz progress" ON juz_progress FOR UPDATE USING (auth.uid() = user_id);

-- 4. RECITATION ATTEMPTS (historique)
CREATE TABLE IF NOT EXISTS recitation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  surah_id INTEGER NOT NULL,
  audio_url TEXT,
  transcription TEXT,
  tajwid_score REAL DEFAULT 0,
  accuracy_score REAL DEFAULT 0,
  overall_score REAL DEFAULT 0,
  tajwid_errors JSONB DEFAULT '[]',
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE recitation_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attempts" ON recitation_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON recitation_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_juz ON user_progress(juz_id);
CREATE INDEX IF NOT EXISTS idx_juz_progress_user ON juz_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_recitation_user ON recitation_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_recitation_surah ON recitation_attempts(surah_id);

-- 6. TRIGGER: Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Debloquer Juz 1 par defaut
  INSERT INTO juz_progress (user_id, juz_id, is_unlocked)
  VALUES (NEW.id, 1, TRUE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 7. TRIGGER: Auto-check Juz completion quand une sourate est validee
CREATE OR REPLACE FUNCTION check_juz_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_surahs INTEGER;
  validated_surahs INTEGER;
  target_juz INTEGER;
BEGIN
  target_juz := NEW.juz_id;
  
  SELECT COUNT(*) INTO total_surahs
  FROM user_progress
  WHERE user_id = NEW.user_id AND juz_id = target_juz;
  
  SELECT COUNT(*) INTO validated_surahs
  FROM user_progress
  WHERE user_id = NEW.user_id AND juz_id = target_juz AND is_validated = TRUE;
  
  IF validated_surahs >= total_surahs AND total_surahs > 0 THEN
    -- Marquer Juz comme complete + trophee
    UPDATE juz_progress
    SET is_completed = TRUE, trophy_earned = TRUE, completed_at = NOW()
    WHERE user_id = NEW.user_id AND juz_id = target_juz;
    
    -- Debloquer le Juz suivant
    IF target_juz < 30 THEN
      INSERT INTO juz_progress (user_id, juz_id, is_unlocked)
      VALUES (NEW.user_id, target_juz + 1, TRUE)
      ON CONFLICT (user_id, juz_id) DO UPDATE SET is_unlocked = TRUE;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_surah_validated ON user_progress;
CREATE TRIGGER on_surah_validated
  AFTER UPDATE OF is_validated ON user_progress
  FOR EACH ROW
  WHEN (NEW.is_validated = TRUE)
  EXECUTE FUNCTION check_juz_completion();
