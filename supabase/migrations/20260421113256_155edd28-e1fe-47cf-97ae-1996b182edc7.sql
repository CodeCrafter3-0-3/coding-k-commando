ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'upload';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS source_platform TEXT;