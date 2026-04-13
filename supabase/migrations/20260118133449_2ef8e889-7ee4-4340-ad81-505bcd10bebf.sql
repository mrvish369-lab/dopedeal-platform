-- =============================================
-- DOPEDEAL PLATFORM - PART 1 DATABASE SCHEMA
-- =============================================

-- 1. Create admin_users table to track admin status
CREATE TABLE public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Create shops table
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  geo_lat DECIMAL(10, 8),
  geo_lng DECIMAL(11, 8),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create sessions table (anonymous user sessions)
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL,
  anonymous_id TEXT NOT NULL,
  whatsapp_number TEXT,
  whatsapp_verified BOOLEAN NOT NULL DEFAULT false,
  device_type TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  referrer TEXT DEFAULT 'QR',
  quiz_completed BOOLEAN NOT NULL DEFAULT false,
  quiz_category TEXT,
  result_type TEXT CHECK (result_type IN ('success', 'failure', NULL)),
  redemption_allowed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create quizzes table (admin-managed questions)
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_option INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Create quiz_settings table (success/fail probability per category)
CREATE TABLE public.quiz_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  success_probability INTEGER NOT NULL DEFAULT 80 CHECK (success_probability >= 0 AND success_probability <= 100),
  fail_probability INTEGER NOT NULL DEFAULT 20 CHECK (fail_probability >= 0 AND fail_probability <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create quiz_logs table (tracks quiz answers per session)
CREATE TABLE public.quiz_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  selected_option INTEGER NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Create events table (tracks all user interactions)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER update_shops_updated_at
  BEFORE UPDATE ON public.shops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quiz_settings_updated_at
  BEFORE UPDATE ON public.quiz_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT USING (is_admin());

-- Shops policies (public read, admin write)
CREATE POLICY "Anyone can view active shops" ON public.shops
  FOR SELECT USING (status = 'active');

CREATE POLICY "Admins can manage shops" ON public.shops
  FOR ALL USING (is_admin());

-- Sessions policies (anonymous users can create/view their own)
CREATE POLICY "Anyone can create sessions" ON public.sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Sessions are viewable by anonymous_id" ON public.sessions
  FOR SELECT USING (true);

CREATE POLICY "Sessions can be updated" ON public.sessions
  FOR UPDATE USING (true);

-- Quizzes policies (public read, admin write)
CREATE POLICY "Anyone can view active quizzes" ON public.quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage quizzes" ON public.quizzes
  FOR ALL USING (is_admin());

-- Quiz settings policies
CREATE POLICY "Anyone can view quiz settings" ON public.quiz_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage quiz settings" ON public.quiz_settings
  FOR ALL USING (is_admin());

-- Quiz logs policies
CREATE POLICY "Anyone can create quiz logs" ON public.quiz_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view quiz logs" ON public.quiz_logs
  FOR SELECT USING (true);

-- Events policies (anyone can insert events for tracking)
CREATE POLICY "Anyone can create events" ON public.events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view events" ON public.events
  FOR SELECT USING (true);

-- =============================================
-- SEED DATA - Default Quiz Categories & Settings
-- =============================================

INSERT INTO public.quiz_settings (category, success_probability, fail_probability) VALUES
  ('bollywood', 80, 20),
  ('social_media', 80, 20),
  ('cricket', 80, 20);

-- Sample quizzes for each category
INSERT INTO public.quizzes (category, question, options, correct_option, display_order) VALUES
  -- Bollywood
  ('bollywood', 'Which actor is known as the "King of Bollywood"?', '["Salman Khan", "Shah Rukh Khan", "Aamir Khan", "Akshay Kumar"]', 1, 1),
  ('bollywood', 'Which movie won the first Oscar for India?', '["Lagaan", "RRR", "Slumdog Millionaire", "Gandhi"]', 1, 2),
  ('bollywood', 'Who directed the movie "Sholay"?', '["Yash Chopra", "Ramesh Sippy", "Raj Kapoor", "Subhash Ghai"]', 1, 3),
  -- Social Media
  ('social_media', 'Which platform is known for short video content?', '["Facebook", "LinkedIn", "Instagram Reels", "Twitter"]', 2, 1),
  ('social_media', 'What does the term "viral" mean in social media?', '["A disease spreading", "Content spreading rapidly", "A type of post", "A hashtag"]', 1, 2),
  ('social_media', 'Which platform uses "Stories" that disappear in 24 hours?', '["YouTube", "WhatsApp", "Reddit", "Pinterest"]', 1, 3),
  -- Cricket
  ('cricket', 'Who is known as the "God of Cricket"?', '["MS Dhoni", "Virat Kohli", "Sachin Tendulkar", "Kapil Dev"]', 2, 1),
  ('cricket', 'Which team has won the most IPL titles?', '["Mumbai Indians", "Chennai Super Kings", "Kolkata Knight Riders", "Royal Challengers"]', 0, 2),
  ('cricket', 'What is the highest individual score in ODI cricket?', '["264", "200", "183", "219"]', 0, 3);