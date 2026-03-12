-- ============================================================
-- Migration 002: 模板数据库化 + Admin 角色
-- ============================================================

-- 1. profiles 表新增 role 字段
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 2. 创建 templates 表
CREATE TABLE public.templates (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  category          TEXT NOT NULL
                    CHECK (category IN ('skincare', 'fashion', 'portrait', 'food', 'product', 'poster')),
  tags              TEXT[] NOT NULL DEFAULT '{}',
  thumbnail_url     TEXT,
  thumbnail_path    TEXT,
  default_model     TEXT NOT NULL DEFAULT 'nano-banana-2'
                    CHECK (default_model IN ('nano-banana-2', 'nano-banana-pro-4k', 'nano-banana-pro-2k')),
  compatible_models TEXT[] NOT NULL DEFAULT '{nano-banana-2}',
  default_image_size JSONB NOT NULL DEFAULT '{"width":1024,"height":1024}',
  variables         JSONB NOT NULL DEFAULT '[]',
  skill_prompt      TEXT NOT NULL DEFAULT '',
  base_prompt       TEXT NOT NULL DEFAULT '',
  negative_prompt   TEXT,
  credit_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  is_published      BOOLEAN NOT NULL DEFAULT false,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  tier_required     TEXT NOT NULL DEFAULT 'free'
                    CHECK (tier_required IN ('free', 'basic', 'pro')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_templates_published ON public.templates(is_published, sort_order);
CREATE INDEX idx_templates_category ON public.templates(category) WHERE is_published = true;

-- 3. templates 表的 updated_at 自动更新
CREATE TRIGGER templates_set_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 4. RLS：已发布模板所有人可读，只有 admin 可写
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published templates"
  ON public.templates FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can view all templates"
  ON public.templates FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert templates"
  ON public.templates FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update templates"
  ON public.templates FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete templates"
  ON public.templates FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 5. Admin 可以读所有 profiles（用户管理）
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view all generations"
  ON public.generations FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can view all credit transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
