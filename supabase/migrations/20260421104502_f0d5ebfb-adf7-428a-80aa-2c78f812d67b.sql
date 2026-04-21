
-- Fix function search_path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Tighten storage SELECT policy: still publicly readable per-file URL,
-- but listing is restricted to the file owner.
drop policy if exists "Anyone can view videos" on storage.objects;

create policy "Public can read individual video files"
  on storage.objects for select
  using (
    bucket_id = 'videos'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or current_setting('request.method', true) = 'GET'
    )
  );
