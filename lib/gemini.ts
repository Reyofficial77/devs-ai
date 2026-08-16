import { GoogleGenerativeAI } from "@google/generative-ai";

// =========================================================
// Sistem multi-API-key dengan fallback otomatis.
// Kalau GEMINI_API_KEY (key #1) kena limit kuota, otomatis coba
// GEMINI_API_KEY_2, lalu GEMINI_API_KEY_3. Cukup isi key mana saja
// yang kamu punya di .env.local — yang kosong otomatis dilewati.
// =========================================================
const API_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3
].filter((key): key is string => Boolean(key && key.trim()));

// Cek apakah error yang terjadi memang soal kuota/rate limit habis
// (bukan error lain seperti API key salah/invalid atau masalah jaringan).
function isQuotaError(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  const message = (err?.message || "").toLowerCase();
  return (
    status === 429 ||
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("rate limit") ||
    message.includes("rate_limit")
  );
}

// Model Gemini yang dipakai. gemini-2.0-flash sudah resmi dimatikan Google.
// Per Agustus 2026, "gemini-3.6-flash" adalah model Flash terbaru yang berstatus GA
// (production-ready) dan direkomendasikan resmi oleh Google — gemini-2.5-flash sendiri
// akan pensiun 16 Okt 2026, jadi langsung pakai generasi 3.x lebih aman untuk jangka panjang.
// Kalau suatu saat model ini juga di-deprecate, cek daftar model terbaru di
// https://ai.google.dev/gemini-api/docs/models dan tinggal ganti string di bawah ini.
export const GEMINI_MODEL = "gemini-3.6-flash";

// =========================================================
// Thinking Budget dinamis — biar AI gak "mikir" kelamaan buat pertanyaan
// simpel, tapi tetap dikasih waktu mikir cukup buat request yang kompleks
// (misal: minta satu sistem game utuh dengan banyak bagian saling terkait).
// Gemini 3.6 mendukung thinkingConfig.thinkingBudget (jumlah token "mikir"
// sebelum mulai menjawab) — makin besar, makin lama tapi makin matang.
// =========================================================

// Kata kunci yang nunjukin permintaan kompleks/multi-bagian, walau
// kalimatnya sendiri belum tentu panjang.
const COMPLEXITY_KEYWORDS = [
  "sistem",
  "lengkap",
  "banyak",
  "integrasi",
  "arsitektur",
  "beberapa file",
  "project besar",
  "dari nol",
  "full",
  "keseluruhan"
];

export function getThinkingBudget(message: string): number {
  const text = message.trim();
  const length = text.length;

  if (length === 0) return 0;

  const lower = text.toLowerCase();
  const complexityHits = COMPLEXITY_KEYWORDS.filter((kw) => lower.includes(kw)).length;

  // Sapaan/basa-basi pendek → gak perlu mikir sama sekali.
  if (length < 20 && complexityHits === 0) return 0;

  // Pertanyaan singkat & simpel.
  if (length < 80 && complexityHits === 0) return 512;

  // Permintaan menengah (1 fitur/script spesifik).
  if (length < 300 && complexityHits <= 1) return 2048;

  // Permintaan panjang, atau ada indikasi kompleksitas (multi-fitur/sistem).
  if (length < 600 || complexityHits >= 2) return 8192;

  // Permintaan besar & panjang sekaligus — kasih budget maksimal.
  return 16384;
}

export const SYSTEM_PROMPT = `Kamu adalah "Devs AI", asisten AI khusus untuk para Developer Roblox.

IDENTITAS:
- Kamu ahli dalam Luau (bahasa scripting Roblox), Roblox Studio, dan seluruh ekosistem API Roblox: DataStoreService, RemoteEvent/RemoteFunction, TweenService, Humanoid, Player, ProximityPrompt, Pathfinding, UI (ScreenGui, Frame), dan lain-lain.
- Kamu paham konsep game seperti sistem Rebirth, leaderboard, currency, monetisasi (Gamepass, Developer Product), anti-exploit dasar, dan optimasi performa.
- Jawab dengan bahasa Indonesia yang jelas, ramah, dan to the point, kecuali user minta bahasa lain.

ATURAN PENULISAN KODE:
- SELALU tulis kode Luau di dalam code block markdown dengan bahasa "lua".
- SETIAP kali kamu menulis satu file kode yang utuh (bukan cuma potongan/contoh singkat), WAJIB beri judul file di baris info code fence dengan format persis seperti ini:
  \`\`\`lua title="NamaFile.lua"
  -- isi kode
  \`\`\`
- Nama file harus deskriptif (contoh: "PlayerDataHandler.lua", "RebirthSystem.server.lua", "ShopUI.client.lua").
- Kalau user minta beberapa file sekaligus (misal satu sistem lengkap), tulis tiap file sebagai code block terpisah, masing-masing dengan title sendiri — sistem akan otomatis menawarkan tombol download per file dan tombol "download semua sebagai .zip".
- Untuk potongan kode kecil/contoh yang bukan file utuh, boleh tanpa title.
- Jangan pernah menaruh penjelasan di DALAM code block. Penjelasan ditulis sebagai teks biasa sebelum/sesudah code block.

GAYA JAWABAN:
- Jelaskan dulu secara singkat apa yang akan dibuat/dijelaskan, baru tampilkan kode.
- Setelah kode, beri catatan singkat cara pakainya di Roblox Studio kalau relevan (misal: taruh di ServerScriptService, StarterPlayerScripts, dsb).
- Kalau pertanyaan user ambigu, boleh tanya balik singkat, tapi kalau bisa diasumsikan dengan wajar, langsung bantu.

ATURAN KHUSUS UNTUK PROJECT BESAR:
- "Project besar" artinya permintaan yang mencakup SATU SISTEM UTUH atau lebih dengan banyak bagian saling terkait — contoh: game lengkap, sistem Rebirth dengan banyak area & multiplier, sistem inventory+shop+currency terintegrasi, atau aplikasi dengan banyak fitur. BUKAN permintaan kecil seperti "buatkan 1 script sederhana", "jelaskan cara pakai RemoteEvent", atau perbaikan bug 1 file.
- Kalau user meminta PROJECT BESAR dan detailnya belum jelas, JANGAN langsung membuatkan kode. Tanya dulu hal-hal penting yang masih kurang jelas, misalnya: nama/tema project, fitur-fitur utama yang diinginkan, gaya UI, batasan teknis, atau referensi game lain. Tanya secukupnya saja (beberapa poin dalam satu balasan), jangan bertele-tele.
- Setelah user menjawab dan kamu sudah punya gambaran cukup lengkap tentang project besar itu (atau setiap kali ada detail penting baru/berubah soal project besar yang sedang dikerjakan), kamu WAJIB menyimpannya ke memori dengan menambahkan baris khusus di PALING AKHIR balasanmu, persis format ini (satu baris, JSON valid, tanpa teks lain menempel di baris yang sama):
  {{DEVSAI_SAVE_PROJECT:{"title":"Judul Singkat Project","details":"Ringkasan lengkap: tema/genre, fitur-fitur yang sudah disepakati, keputusan desain, progress sejauh ini, dan hal yang masih perlu dikerjakan."}}}
- Baris {{DEVSAI_SAVE_PROJECT:...}} ini TIDAK akan terlihat oleh user (otomatis disembunyikan sistem), jadi jangan menyinggungnya sama sekali di teks balasan biasa.
- title harus konsisten kalau kamu update project yang sama (misal selalu "Game Roblox: Run For ASMR"), supaya ringkasan lama ter-update, bukan malah bikin entry baru yang terpisah.
- JANGAN memakai format ini untuk obrolan singkat/pertanyaan kecil yang bukan bagian dari project besar.

MEMORI PROJECT YANG SUDAH TERSIMPAN:
- Kalau di bawah prompt ini ada bagian "RINGKASAN PROJECT BESAR USER YANG SUDAH TERSIMPAN", itu adalah project(-project) besar yang pernah dibahas user di sesi/chat SEBELUMNYA. Gunakan sebagai konteks kalau relevan dengan pesan user sekarang — user tidak perlu mengulang dari awal. Kalau user melanjutkan project itu, jangan tanya ulang hal-hal yang sudah ada di ringkasan, cukup tanyakan yang belum jelas saja.`;

// Membangun system prompt akhir, dengan menyisipkan ringkasan project besar
// milik user (kalau ada) supaya AI "ingat" walau di chat/sesi yang baru.
export function buildSystemPrompt(projectMemories: { title: string; details: string }[]): string {
  if (!projectMemories || projectMemories.length === 0) {
    return SYSTEM_PROMPT;
  }

  const memoryBlock = projectMemories
    .map((p) => `### ${p.title}\n${p.details}`)
    .join("\n\n");

  return `${SYSTEM_PROMPT}\n\nRINGKASAN PROJECT BESAR USER YANG SUDAH TERSIMPAN:\n${memoryBlock}`;
}

export interface GeminiHistoryItem {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function askGemini(
  history: GeminiHistoryItem[],
  newMessage: string,
  systemPrompt: string = SYSTEM_PROMPT
) {
  if (API_KEYS.length === 0) {
    throw new Error("Tidak ada GEMINI_API_KEY yang di-set di environment variables.");
  }

  let lastError: any = null;

  for (let i = 0; i < API_KEYS.length; i++) {
    const genAI = new GoogleGenerativeAI(API_KEYS[i]);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt,
      // "as any" karena thinkingConfig masih tipe baru, belum sempat
      // ke-update di definisi TypeScript versi SDK yang dipakai.
      generationConfig: {
        thinkingConfig: { thinkingBudget: getThinkingBudget(newMessage) }
      } as any
    });

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(newMessage);
      return result.response.text();
    } catch (err: any) {
      lastError = err;
      const isLastKey = i === API_KEYS.length - 1;
      if (isQuotaError(err) && !isLastKey) {
        console.warn(`[Gemini] API key #${i + 1} kena limit kuota, beralih ke key #${i + 2}...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// Versi streaming: mengembalikan potongan teks (chunk) satu per satu begitu Gemini
// selesai men-generate-nya, bukan menunggu jawaban lengkap. Ini yang dipakai buat efek
// "AI sedang mengetik" secara real (bukan animasi pura-pura di frontend).
//
// Fallback antar-key hanya terjadi SEBELUM ada teks yang mulai dikirim ke user
// (yaitu waktu memulai koneksi ke Gemini). Kalau kuota habis di tengah-tengah AI
// sedang mengetik jawaban (kasus langka), fallback tidak dilakukan lagi karena
// sebagian jawaban sudah kepalang dikirim ke client — error akan tampil sebagai
// catatan singkat di akhir jawaban (ditangani di app/api/chat/route.ts).
export async function* askGeminiStream(
  history: GeminiHistoryItem[],
  newMessage: string,
  systemPrompt: string = SYSTEM_PROMPT
) {
  if (API_KEYS.length === 0) {
    throw new Error("Tidak ada GEMINI_API_KEY yang di-set di environment variables.");
  }

  let lastError: any = null;

  for (let i = 0; i < API_KEYS.length; i++) {
    const genAI = new GoogleGenerativeAI(API_KEYS[i]);
    const model = genAI.getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction: systemPrompt,
      // "as any" karena thinkingConfig masih tipe baru, belum sempat
      // ke-update di definisi TypeScript versi SDK yang dipakai.
      generationConfig: {
        thinkingConfig: { thinkingBudget: getThinkingBudget(newMessage) }
      } as any
    });

    let hasYieldedAny = false;

    try {
      const chat = model.startChat({ history });
      const result = await chat.sendMessageStream(newMessage);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          hasYieldedAny = true;
          yield text;
        }
      }
      return; // berhasil sampai selesai, tidak perlu lanjut ke key berikutnya
    } catch (err: any) {
      lastError = err;
      const isLastKey = i === API_KEYS.length - 1;
      const canFallback = isQuotaError(err) && !hasYieldedAny && !isLastKey;

      if (canFallback) {
        console.warn(`[Gemini] API key #${i + 1} kena limit kuota, beralih ke key #${i + 2}...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}
