
-- =============== PROFILES ===============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- =============== VIDEOS ===============
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_url text,
  thumbnail_url text,
  title text not null,
  status text not null default 'processing',
  views_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index videos_user_id_idx on public.videos(user_id);
create index videos_created_at_idx on public.videos(created_at desc);

alter table public.videos enable row level security;

create policy "Users can view their own videos"
  on public.videos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own videos"
  on public.videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own videos"
  on public.videos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own videos"
  on public.videos for delete
  using (auth.uid() = user_id);

create trigger videos_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

-- =============== ANALYTICS ===============
create table public.analytics (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  views integer not null default 0,
  watch_time integer not null default 0,
  engagement integer not null default 0,
  revenue numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index analytics_user_id_date_idx on public.analytics(user_id, date desc);
create index analytics_video_id_idx on public.analytics(video_id);

alter table public.analytics enable row level security;

create policy "Users can view their own analytics"
  on public.analytics for select
  using (auth.uid() = user_id);

create policy "Users can insert their own analytics"
  on public.analytics for insert
  with check (auth.uid() = user_id);

-- =============== STORAGE: videos bucket ===============
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true);

create policy "Anyone can view videos"
  on storage.objects for select
  using (bucket_id = 'videos');

create policy "Authenticated users can upload to their folder"
  on storage.objects for insert
  with check (
    bucket_id = 'videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can update their own files"
  on storage.objects for update
  using (
    bucket_id = 'videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'videos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
