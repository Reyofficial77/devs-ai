-- =========================================================
-- Devs AI — Supabase Schema
-- Cara pakai: buka Supabase Dashboard > SQL Editor > New Query,
-- paste seluruh isi file ini, lalu klik "Run".
-- =========================================================

-- Tabel percakapan (satu baris = satu thread chat)
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Percakapan baru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tabel pesan (banyak pesan per chat)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Index biar query riwayat & pesan cepat
create index if not exists chats_user_id_idx on public.chats(user_id);
create index if not exists chats_updated_at_idx on public.chats(updated_at desc);
create index if not exists messages_chat_id_idx on public.messages(chat_id);
create index if not exists messages_created_at_idx on public.messages(created_at);

-- =========================================================
-- Row Level Security (RLS)
-- Wajib diaktifkan supaya user A tidak bisa baca/edit chat milik user B.
-- =========================================================

alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- Kebijakan untuk tabel "chats": user hanya boleh akses baris miliknya sendiri
create policy "Users can view their own chats"
  on public.chats for select
  using (auth.uid() = user_id);

create policy "Users can insert their own chats"
  on public.chats for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own chats"
  on public.chats for update
  using (auth.uid() = user_id);

create policy "Users can delete their own chats"
  on public.chats for delete
  using (auth.uid() = user_id);

-- Kebijakan untuk tabel "messages": user hanya boleh akses pesan
-- yang ada di dalam chat miliknya sendiri (dicek lewat relasi ke tabel chats)
create policy "Users can view messages in their own chats"
  on public.messages for select
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their own chats"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

create policy "Users can delete messages in their own chats"
  on public.messages for delete
  using (
    exists (
      select 1 from public.chats
      where chats.id = messages.chat_id
      and chats.user_id = auth.uid()
    )
  );

-- =========================================================
-- Memori Project Besar (lintas chat/sesi)
-- Menyimpan ringkasan project besar yang sedang dikerjakan user (misal: game
-- Roblox dengan banyak sistem), supaya Devs AI tetap "ingat" walau user buka
-- chat baru. Diisi otomatis oleh AI lewat app/api/chat/route.ts, bukan manual.
-- =========================================================

create table if not exists public.project_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  details text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, title)
);

create index if not exists project_memory_user_id_idx on public.project_memory(user_id);

alter table public.project_memory enable row level security;

create policy "Users can view their own project memory"
  on public.project_memory for select
  using (auth.uid() = user_id);

create policy "Users can insert their own project memory"
  on public.project_memory for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own project memory"
  on public.project_memory for update
  using (auth.uid() = user_id);

create policy "Users can delete their own project memory"
  on public.project_memory for delete
  using (auth.uid() = user_id);

-- =========================================================
-- Selesai. Setelah ini, aktifkan provider login di:
-- Authentication > Providers > Google / GitHub (isi Client ID & Secret).
-- Untuk redirect URL, pakai: https://domain-kamu.com/auth/callback
-- =========================================================
