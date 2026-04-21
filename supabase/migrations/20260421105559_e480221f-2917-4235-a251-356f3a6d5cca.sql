
-- AI analysis columns
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS ai_score INT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS ai_feedback JSONB;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS viral_status TEXT NOT NULL DEFAULT 'pending';

-- Auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage policies for the videos bucket (per-user folder)
DROP POLICY IF EXISTS "Users can view their own videos in storage" ON storage.objects;
CREATE POLICY "Users can view their own videos in storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own videos to storage" ON storage.objects;
CREATE POLICY "Users can upload their own videos to storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own videos in storage" ON storage.objects;
CREATE POLICY "Users can update their own videos in storage"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own videos in storage" ON storage.objects;
CREATE POLICY "Users can delete their own videos in storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
