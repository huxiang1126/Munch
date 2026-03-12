-- ============================================================
-- Migration 003: 用户素材库
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_assets (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'reference'
               CHECK (kind IN ('reference', 'face', 'outfit', 'product', 'other')),
  mime_type    TEXT NOT NULL,
  file_size    BIGINT NOT NULL,
  width        INTEGER,
  height       INTEGER,
  storage_path TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_assets_user_created
  ON public.user_assets(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_assets_user_last_used
  ON public.user_assets(user_id, last_used_at DESC NULLS LAST);

DROP TRIGGER IF EXISTS user_assets_set_updated_at ON public.user_assets;
CREATE TRIGGER user_assets_set_updated_at
  BEFORE UPDATE ON public.user_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assets"
  ON public.user_assets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assets"
  ON public.user_assets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assets"
  ON public.user_assets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own assets"
  ON public.user_assets FOR DELETE
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-assets',
  'user-assets',
  false,
  15728640,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
