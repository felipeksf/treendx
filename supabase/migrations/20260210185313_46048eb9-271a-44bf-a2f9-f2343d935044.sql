
-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'expired');
CREATE TYPE public.currency_tag AS ENUM ('USD', 'EUR', 'general');
CREATE TYPE public.event_category AS ENUM ('mentoria', 'relatorio', 'macroeconomico');
CREATE TYPE public.score_frequency AS ENUM ('weekly', 'biweekly', 'monthly');

-- ==========================================
-- PROFILES TABLE
-- ==========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  trial_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- USER ROLES TABLE (separate for security)
-- ==========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- HELPER FUNCTION: has_role (security definer)
-- ==========================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ==========================================
-- DAILY SCORES TABLE
-- ==========================================
CREATE TABLE public.daily_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  score_date DATE NOT NULL DEFAULT CURRENT_DATE,
  frequency score_frequency NOT NULL DEFAULT 'weekly',
  usd_score INTEGER CHECK (usd_score BETWEEN 1 AND 100),
  eur_score INTEGER CHECK (eur_score BETWEEN 1 AND 100),
  zone_usd TEXT,
  zone_eur TEXT,
  rate_usd NUMERIC(10,4),
  rate_eur NUMERIC(10,4),
  comment_buy TEXT,
  comment_sell TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (score_date, frequency)
);

ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- FEED POSTS TABLE
-- ==========================================
CREATE TABLE public.feed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  body TEXT NOT NULL,
  currency currency_tag NOT NULL DEFAULT 'general',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- FEED LIKES TABLE
-- ==========================================
CREATE TABLE public.feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);

ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- AGENDA EVENTS TABLE
-- ==========================================
CREATE TABLE public.agenda_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  category event_category NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- USER DECISIONS TABLE
-- ==========================================
CREATE TABLE public.user_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  currency TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  rate NUMERIC(10,4) NOT NULL,
  zone TEXT,
  savings NUMERIC(15,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_decisions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_scores_updated_at BEFORE UPDATE ON public.daily_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feed_posts_updated_at BEFORE UPDATE ON public.feed_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agenda_events_updated_at BEFORE UPDATE ON public.agenda_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- RLS POLICIES: profiles
-- ==========================================
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- RLS POLICIES: user_roles
-- ==========================================
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- RLS POLICIES: daily_scores
-- ==========================================
CREATE POLICY "Authenticated users can view scores" ON public.daily_scores
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert scores" ON public.daily_scores
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE POLICY "Admins can update scores" ON public.daily_scores
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scores" ON public.daily_scores
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- RLS POLICIES: feed_posts
-- ==========================================
CREATE POLICY "Authenticated users can view posts" ON public.feed_posts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert posts" ON public.feed_posts
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE POLICY "Admins can update posts" ON public.feed_posts
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete posts" ON public.feed_posts
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- RLS POLICIES: feed_likes
-- ==========================================
CREATE POLICY "Authenticated users can view likes" ON public.feed_likes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can like posts" ON public.feed_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own likes" ON public.feed_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ==========================================
-- RLS POLICIES: agenda_events
-- ==========================================
CREATE POLICY "Authenticated users can view events" ON public.agenda_events
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert events" ON public.agenda_events
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE POLICY "Admins can update events" ON public.agenda_events
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete events" ON public.agenda_events
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================
-- RLS POLICIES: user_decisions
-- ==========================================
CREATE POLICY "Users can view own decisions" ON public.user_decisions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all decisions" ON public.user_decisions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own decisions" ON public.user_decisions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own decisions" ON public.user_decisions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_daily_scores_date ON public.daily_scores(score_date DESC);
CREATE INDEX idx_daily_scores_date_freq ON public.daily_scores(score_date, frequency);
CREATE INDEX idx_feed_posts_created ON public.feed_posts(created_at DESC);
CREATE INDEX idx_feed_posts_currency ON public.feed_posts(currency);
CREATE INDEX idx_feed_likes_post ON public.feed_likes(post_id);
CREATE INDEX idx_feed_likes_user_post ON public.feed_likes(user_id, post_id);
CREATE INDEX idx_agenda_events_date ON public.agenda_events(event_date);
CREATE INDEX idx_user_decisions_user ON public.user_decisions(user_id);
CREATE INDEX idx_user_decisions_created ON public.user_decisions(created_at DESC);
