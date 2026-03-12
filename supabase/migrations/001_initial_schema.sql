CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  credit_balance INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'basic', 'pro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, credit_balance)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('grant', 'purchase', 'consume', 'refund')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_tx_user ON public.credit_transactions(user_id, created_at DESC);

CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}',
  model TEXT NOT NULL CHECK (model IN ('flux-pro', 'gpt-image')),
  image_count INTEGER NOT NULL DEFAULT 2 CHECK (image_count BETWEEN 1 AND 4),
  raw_prompt TEXT,
  compiled_prompt TEXT,
  negative_prompt TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'compiling', 'generating', 'completed', 'failed', 'cancelled'
  )),
  error_message TEXT,
  credits_cost INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_gen_user_status ON public.generations(user_id, status, created_at DESC);

CREATE TABLE public.generated_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_index INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  format TEXT DEFAULT 'png',
  is_favorited BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_genimg_generation ON public.generated_images(generation_id);
CREATE INDEX idx_genimg_user ON public.generated_images(user_id, created_at DESC);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own credit transactions"
  ON public.credit_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own generations"
  ON public.generations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations"
  ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own images"
  ON public.generated_images FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own images"
  ON public.generated_images FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER generations_set_updated_at
  BEFORE UPDATE ON public.generations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
