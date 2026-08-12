# Devs AI — Asisten AI untuk Developer Roblox

AI chat khusus buat bantu Developer Roblox: nulis script Luau, jelasin sistem game (Rebirth, DataStore, RemoteEvent, dll), dan generate file kode yang bisa langsung didownload (per file atau sekaligus `.zip`).

## Fitur

- Login wajib: Google, GitHub, atau Email/Password (Supabase Auth)
- Chat AI pakai Gemini API, dengan system prompt yang sudah diarahkan khusus Roblox dev
- Setiap balasan AI yang mengandung kode dengan judul file otomatis dapat tombol **Download**, dan kalau ada beberapa file sekaligus muncul tombol **Download semua (.zip)**
- Riwayat chat tersimpan permanen di database Supabase, bisa dibuka lagi kapan saja, bisa dihapus
- Mobile-friendly: sidebar jadi hamburger menu di HP, layout menyesuaikan layar kecil
- Tema otomatis ikut sistem HP/laptop: **White + Blue** (terang) atau **Dark + Purple** (gelap), bisa juga di-toggle manual

## Struktur Project

```
devs-ai/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          → endpoint kirim pesan ke Gemini
│   │   └── chats/[chatId]/route.ts → endpoint hapus chat
│   ├── auth/callback/route.ts     → handle redirect OAuth Google/GitHub
│   ├── chat/
│   │   ├── layout.tsx             → ambil data user + daftar chat
│   │   ├── page.tsx                → halaman chat baru (kosong)
│   │   └── [chatId]/page.tsx      → halaman chat yang sudah ada isinya
│   ├── login/page.tsx             → halaman login
│   └── layout.tsx / globals.css
├── components/                     → semua komponen UI (Sidebar, ChatView, Message, dll)
├── lib/
│   ├── gemini.ts                   → konfigurasi & system prompt Gemini
│   ├── supabase/                   → client Supabase (browser & server)
│   └── utils/codeParser.ts         → logic deteksi code block + fungsi download
├── supabase/schema.sql             → SQL buat setup database
└── middleware.ts                   → proteksi route /chat (wajib login)
```

## 1. Setup Awal (Termux / Android)

Kalau kamu kerja dari Termux seperti project kamu yang lain, lakukan ini dulu:

```bash
pkg update && pkg upgrade -y
pkg install nodejs-lts git -y
```

Lalu extract folder `devs-ai` hasil download ini, masuk ke foldernya, dan install dependency:

```bash
cd devs-ai
npm install
```

> **Catatan penting untuk Termux (arm64):** Turbopack Next.js belum didukung penuh di Termux. Kalau nanti mau jalanin mode development, pakai:
> ```bash
> npx next dev --webpack
> ```
> bukan `npm run dev` biasa (yang di `package.json` sudah dipakai default webpack juga, tapi kalau ada error terkait Turbopack, tambahkan flag `--webpack` secara manual).

## 2. Setup Supabase (Database + Login)

1. Buat akun & project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** di dashboard Supabase → New Query → paste seluruh isi file `supabase/schema.sql` → klik **Run**. Ini akan otomatis membuat tabel `chats`, `messages`, beserta aturan keamanan (Row Level Security) supaya user tidak bisa lihat chat user lain.
3. Aktifkan provider login di **Authentication → Providers**:
   - **Email**: biasanya sudah aktif secara default
   - **Google**: butuh Client ID & Secret dari [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - **GitHub**: butuh Client ID & Secret dari [GitHub Developer Settings](https://github.com/settings/developers)
   - Di kedua provider OAuth tersebut, isi **Authorization callback URL** dengan:
     `https://[project-id].supabase.co/auth/v1/callback` (Supabase kasih tau URL persisnya di halaman provider)
4. Ambil **Project URL** dan **anon public key** di **Project Settings → API**

## 3. Setup Gemini API

1. Buka [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Buat API Key baru (gratis, ada kuota harian)

## 4. Isi Environment Variables

Ubah nama file `.env.example` jadi `.env.local`, lalu isi:

```bash
mv .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=isi_dari_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_dari_supabase
GEMINI_API_KEY=isi_dari_google_ai_studio
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 5. Jalankan di Local

```bash
npm run dev
```

Buka `http://localhost:3000` — otomatis diarahkan ke halaman login.

## 6. Deploy ke Vercel

1. Push project ini ke GitHub (repo baru)
2. Buka [vercel.com](https://vercel.com) → New Project → import repo tadi
3. Di bagian **Environment Variables**, isi 4 variabel yang sama seperti di `.env.local`, tapi untuk `NEXT_PUBLIC_SITE_URL` isi dengan domain Vercel kamu, contoh: `https://devs-ai.vercel.app`
4. Deploy. Setelah live, jangan lupa update **Authorization callback URL** di Google Cloud Console & GitHub OAuth App dengan domain Vercel yang baru (bukan localhost lagi)

## Cara Kerja Download File

Gemini diarahkan lewat system prompt (`lib/gemini.ts`) supaya setiap kali menulis kode file yang utuh, dia tulis dengan format:

````
```lua title="RebirthSystem.server.lua"
-- isi kode
```
````

Frontend (`lib/utils/codeParser.ts`) mendeteksi pola ini, lalu menampilkan tombol download di bawah tiap balasan AI. Kalau dalam satu balasan ada lebih dari satu file, muncul juga tombol **Download semua (.zip)** yang membundel semua file jadi satu `.zip` menggunakan library `jszip` — proses ini 100% terjadi di browser (client-side), tidak perlu server storage tambahan.

## Kemungkinan Pengembangan Lanjutan

- Simpan file yang di-generate ke **Supabase Storage** biar link download-nya tetap ada walau riwayat chat dibuka lagi nanti (saat ini file di-generate ulang dari teks pesan yang tersimpan, jadi sebenarnya tetap bisa didownload kapan saja selama chat-nya ada)
- Fitur rename judul chat manual
- Fitur search di riwayat chat
- Upload gambar (misal screenshot error di Roblox Studio) untuk ditanyakan ke AI (Gemini support multimodal)
