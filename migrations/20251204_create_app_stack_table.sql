-- Create app_recommendations table
create table if not exists public.app_recommendations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  icon_url text,
  developer text,
  category text,
  description text,
  link_url text,
  is_paid boolean default false,
  sort_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.app_recommendations enable row level security;

-- Policies
create policy "Public apps are viewable by everyone"
  on public.app_recommendations for select
  using ( true );

create policy "Users can insert their own apps"
  on public.app_recommendations for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own apps"
  on public.app_recommendations for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own apps"
  on public.app_recommendations for delete
  using ( auth.uid() = user_id );

-- Storage Bucket for App Icons
insert into storage.buckets (id, name, public)
values ('app-icons', 'app-icons', true)
on conflict (id) do nothing;

-- Storage Policies
create policy "App icons are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'app-icons' );

create policy "Users can upload app icons"
  on storage.objects for insert
  with check ( bucket_id = 'app-icons' and auth.uid() = owner );

create policy "Users can update their app icons"
  on storage.objects for update
  using ( bucket_id = 'app-icons' and auth.uid() = owner );

create policy "Users can delete their app icons"
  on storage.objects for delete
  using ( bucket_id = 'app-icons' and auth.uid() = owner );
