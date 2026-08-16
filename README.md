# Devs AI — Panduan Setup Lengkap (dari Nol)

AI chat khusus buat Developer Roblox — Next.js + Gemini API + Supabase Auth & Database. Panduan ini sudah termasuk semua fix dari isu-isu yang pernah ketemu pas setup di Termux/Android.

---

## 0. Yang perlu disiapkan dulu

- HP Android dengan **Termux** ter-install (dari F-Droid, bukan Play Store — versi Play Store sudah tidak di-update)
- Akun [Supabase](https://supabase.com) (gratis)
- Akun [Google AI Studio](https://aistudio.google.com) buat API key Gemini (gratis)
- Akun GitHub (buat push kode + deploy)
- Akun [Vercel](https://vercel.com) (gratis, login pakai GitHub)

---

## 1. Setup Termux + Linux (Ubuntu via proot)

Android/Termux **tidak punya binary native SWC** yang dibutuhkan Next.js, jadi kita jalankan semuanya dari dalam Ubuntu yang di-install di atas Termux.

```bash
pkg update && pkg upgrade -y
pkg install proot-distro git -y
proot-distro install ubuntu
```

Setiap kali mau kerja, masuk ke Ubuntu sambil mount folder Termux (`$HOME`) supaya file project bisa diakses dari dalam:

```bash
proot-distro login ubuntu --bind $HOME:/root/termux-home
```

**Mulai dari sini, semua perintah dijalankan DI DALAM Ubuntu ini.** Install Node.js (sekali saja, per instalasi Ubuntu):

```bash
apt update && apt install -y nodejs npm
```

> Kalau nanti keluar dari sesi ini (nutup Termux dll), tinggal ulangi perintah `proot-distro login ubuntu --bind $HOME:/root/termux-home` — tidak perlu install ulang dari awal.

---

## 2. Extract project & install dependency

```bash
cd /root/termux-home/downloads
unzip devs-ai.zip
cd devs-ai
```

**Ganti dulu lokasi cache npm** (bug proot-distro bikin cache default gagal):

```bash
mkdir -p /tmp/npm-cache
npm config set cache /tmp/npm-cache
```

Install dependency:

```bash
npm install
```

**Wajib:** buat file `.babelrc` supaya Next.js tidak butuh binary native SWC (yang memang tidak tersedia untuk Android):

```bash
cat > .babelrc << 'EOF'
{
  "presets": ["next/babel"]
}
EOF
```

> ⚠️ File `.babelrc` ini **cuma buat lokal Termux**, jangan sampai ikut ke-push ke GitHub (nanti bikin build Vercel gagal). Sudah otomatis diabaikan lewat `.gitignore` di project ini.

---

## 3. Setup Database & Login (Supabase)

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** → New Query → paste seluruh isi file `supabase/schema.sql` dari project ini → **Run**. Ini bikin tabel `chats`, `messages`, plus aturan keamanan (RLS) biar user tidak bisa lihat chat user lain.
3. Buka **Authentication → Providers**, aktifkan:
   - **Email** (biasanya sudah default aktif)
   - **Google** — butuh Client ID & Secret dari [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - **GitHub** — butuh Client ID & Secret dari [GitHub Developer Settings](https://github.com/settings/developers)
   - Di kedua OAuth provider itu, isi callback URL dengan URL yang Supabase kasih tau di halaman provider-nya (formatnya `https://[project-id].supabase.co/auth/v1/callback`)
4. **Authentication → URL Configuration** — isi dulu dengan localhost untuk sekarang (nanti diganti lagi di Langkah 6 setelah deploy):
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
5. Ambil **Project URL** dan **anon public key** di **Project Settings → API** (key-nya panjang, pastikan ke-copy full)

---

## 4. Setup Gemini API (bisa lebih dari 1 key)

1. Buka [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → buat API key baru

**Fitur fallback otomatis:** project ini mendukung sampai **3 API key Gemini sekaligus**. Kalau key #1 kena limit kuota harian, sistem otomatis pindah pakai key #2, lalu key #3 — tanpa user sadar ada perpindahan, dan tanpa perlu restart server. Supaya kuota gratisnya benar-benar terpisah (bukan gabung jadi satu limit), buat tiap key dari **akun Google yang berbeda**:

- Key #1 → akun Google A → isi ke `GEMINI_API_KEY`
- Key #2 → akun Google B → isi ke `GEMINI_API_KEY_2`
- Key #3 → akun Google C → isi ke `GEMINI_API_KEY_3`

`GEMINI_API_KEY_2` dan `GEMINI_API_KEY_3` sifatnya **opsional** — kalau cuma diisi 1, sistem tetap jalan normal seperti biasa (tanpa fallback).

---

## 5. Isi Environment Variables & jalankan lokal

```bash
mv .env.example .env.local
nano .env.local
```

Isi 4 baris ini:

```env
NEXT_PUBLIC_SUPABASE_URL=isi_dari_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_dari_supabase
GEMINI_API_KEY=isi_dari_google_ai_studio
GEMINI_API_KEY_2=isi_dari_google_ai_studio_akun_kedua
GEMINI_API_KEY_3=isi_dari_google_ai_studio_akun_ketiga
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Simpan (`Ctrl+O`, Enter, `Ctrl+X` di nano), lalu jalankan:

```bash
npm run dev
```

Buka `http://localhost:3000` di browser HP. Compile pertama agak lambat (Babel + proot), sabar aja.

---

## 6. Push ke GitHub & Deploy ke Vercel

**Push ke GitHub:**

```bash
git init
git add .
git commit -m "Devs AI - initial commit"
git remote add origin https://github.com/USERNAME/devs-ai.git
git branch -M main
git push -u origin main
```

Ganti `USERNAME`. Kalau diminta password, pakai **Personal Access Token** (buat di github.com/settings/tokens, centang scope `repo`) — bukan password akun biasa.

> Kalau kena "Repository not found", pastikan repo `devs-ai` sudah benar-benar dibuat dulu di GitHub (github.com/new, jangan centang "Add README").

**Deploy ke Vercel:**

1. [vercel.com/new](https://vercel.com/new) → Import repo `devs-ai`
2. Framework otomatis kedeteksi Next.js, biarkan default
3. Isi **Environment Variables** (5 variabel sama seperti `.env.local` — `GEMINI_API_KEY_2`/`_3` boleh dikosongkan kalau belum punya), untuk `NEXT_PUBLIC_SITE_URL` isi domain Vercel kamu nanti (boleh isi asal dulu, edit lagi setelah tau domainnya)
4. **Deploy**

**Setelah live**, kembali ke Supabase → **Authentication → URL Configuration**, update:
- Site URL → `https://domain-kamu.vercel.app`
- Redirect URLs → tambahkan `https://domain-kamu.vercel.app/auth/callback` (boleh biarkan yang localhost tetap ada juga)

Lalu balik ke Vercel → **Settings → Environment Variables**, update `NEXT_PUBLIC_SITE_URL` ke domain Vercel yang benar → **Deployments → (⋯) → Redeploy** (env variable baru butuh redeploy manual, tidak otomatis kepakai).

Kalau pakai Google/GitHub OAuth, jangan lupa juga update **Authorized redirect URI** di Google Cloud Console / GitHub OAuth App kalau ada validasi domain tambahan di sana.

---

## Fitur Memori Project Besar

Kalau kamu minta Devs AI buatkan sesuatu yang tergolong **project besar** (contoh: "buatkan game Roblox dengan sistem Rebirth, banyak area, shop, dan leaderboard"), AI **tidak langsung ngoding** — dia tanya dulu detail yang masih kurang (tema, fitur, batasan, dll). Setelah cukup jelas, AI otomatis menyimpan ringkasan project itu ke database (`project_memory`), terikat ke akun user — **bukan** ke satu chat doang.

Efeknya: kalau kamu buka **chat baru** kapan pun, AI otomatis "ingat" project besar yang lagi kamu kerjakan, tanpa perlu jelasin ulang dari nol. Untuk permintaan kecil (1 script, 1 pertanyaan singkat), AI langsung bantu seperti biasa tanpa nanya-nanya dulu.

> Kalau kamu sudah punya project Supabase yang lama (sudah pernah run `schema.sql` sebelumnya), **jangan run ulang seluruh file itu** — nanti error karena beberapa policy sudah ada duluan. Cukup jalankan SQL tambahan di bawah ini saja di SQL Editor Supabase:
>
> ```sql
> create table if not exists public.project_memory (
>   id uuid primary key default gen_random_uuid(),
>   user_id uuid not null references auth.users(id) on delete cascade,
>   title text not null,
>   details text not null,
>   created_at timestamptz not null default now(),
>   updated_at timestamptz not null default now(),
>   unique (user_id, title)
> );
>
> create index if not exists project_memory_user_id_idx on public.project_memory(user_id);
>
> alter table public.project_memory enable row level security;
>
> create policy "Users can view their own project memory"
>   on public.project_memory for select using (auth.uid() = user_id);
>
> create policy "Users can insert their own project memory"
>   on public.project_memory for insert with check (auth.uid() = user_id);
>
> create policy "Users can update their own project memory"
>   on public.project_memory for update using (auth.uid() = user_id);
>
> create policy "Users can delete their own project memory"
>   on public.project_memory for delete using (auth.uid() = user_id);
> ```
>
> Untuk project Supabase yang benar-benar baru, cukup run `supabase/schema.sql` seperti biasa (sudah termasuk tabel ini).

## Troubleshooting Cepat

| Gejala | Penyebab | Solusi |
|---|---|---|
| `npm install` error `ENOENT ... _cacache` | Bug cache npm di proot-distro | `npm config set cache /tmp/npm-cache` lalu install ulang |
| `Failed to load SWC binary for android/arm64` | Termux gak punya binary native | Pastikan `.babelrc` ada & jalan dari dalam Ubuntu (proot), bukan Termux langsung |
| Build Vercel gagal, error di `react-markdown`/regex Unicode | `.babelrc` ikut ke-push ke GitHub | `git rm --cached .babelrc`, pastikan ada di `.gitignore`, push lagi |
| Login Google/GitHub selalu balik ke `localhost` | Site URL Supabase belum diupdate | Authentication → URL Configuration → ganti Site URL & Redirect URLs ke domain Vercel |
| Email login: "Invalid API key" | Anon key salah/kepotong di Vercel env var | Copy ulang full anon key dari Supabase, update di Vercel, lalu **Redeploy manual** |
| Gemini error "model ... no longer available" | Model Gemini di-deprecate Google | Cek model terbaru di [ai.google.dev/gemini-api/docs/models](https://ai.google.dev/gemini-api/docs/models), update `GEMINI_MODEL` di `lib/gemini.ts` |

---

## Testing (Vitest)

Project ini pakai [Vitest](https://vitest.dev) buat unit test fungsi-fungsi penting. Pendekatannya TDD: logic yang murni/pure (gak nyentuh browser API langsung) dipisah ke fungsi sendiri supaya gampang di-test tanpa perlu device/browser beneran.

Jalankan test:

```bash
npm install
npm test
```

Mode watch (auto re-run pas ada perubahan file):

```bash
npm run test:watch
```

**Test yang sudah ada:**
- `lib/hooks/__tests__/computeViewportMetrics.test.ts` — memastikan perhitungan tinggi & offset viewport (buat fix keyboard mobile) benar di berbagai skenario (keyboard tertutup, keyboard terbuka & viewport bergeser, browser tanpa `visualViewport`)
- `lib/utils/__tests__/codeParser.test.ts` — parsing code block jadi file yang bisa didownload, dan parsing/hiding marker memori project
- `lib/__tests__/gemini.test.ts` — memastikan ringkasan project besar tersisip dengan benar ke system prompt AI

Kalau nambah fitur baru yang ada logic pentingnya, disarankan tulis test dulu (yang gagal), baru bikin implementasinya sampai test-nya hijau — terutama buat fungsi murni di `lib/`.

## Struktur Project (ringkas)

```
devs-ai/
├── app/
│   ├── api/chat/route.ts          → endpoint chat (streaming ke Gemini)
│   ├── api/chats/[chatId]/route.ts → hapus chat
│   ├── auth/callback/route.ts     → handle redirect OAuth
│   ├── chat/                       → halaman chat (baru & histori)
│   └── login/page.tsx             → halaman login
├── components/                     → Sidebar, ChatView, Message, ChatInput, dll
├── lib/gemini.ts                   → konfigurasi model + system prompt AI
├── lib/supabase/                   → client Supabase (browser & server)
└── supabase/schema.sql             → SQL setup database + RLS
```
