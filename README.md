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

## 4. Setup Gemini API

1. Buka [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → buat API key baru

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
3. Isi **Environment Variables** (4 variabel sama seperti `.env.local`), untuk `NEXT_PUBLIC_SITE_URL` isi domain Vercel kamu nanti (boleh isi asal dulu, edit lagi setelah tau domainnya)
4. **Deploy**

**Setelah live**, kembali ke Supabase → **Authentication → URL Configuration**, update:
- Site URL → `https://domain-kamu.vercel.app`
- Redirect URLs → tambahkan `https://domain-kamu.vercel.app/auth/callback` (boleh biarkan yang localhost tetap ada juga)

Lalu balik ke Vercel → **Settings → Environment Variables**, update `NEXT_PUBLIC_SITE_URL` ke domain Vercel yang benar → **Deployments → (⋯) → Redeploy** (env variable baru butuh redeploy manual, tidak otomatis kepakai).

Kalau pakai Google/GitHub OAuth, jangan lupa juga update **Authorized redirect URI** di Google Cloud Console / GitHub OAuth App kalau ada validasi domain tambahan di sana.

---

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
