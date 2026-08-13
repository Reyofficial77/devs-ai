import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Model Gemini yang dipakai. gemini-2.0-flash sudah resmi dimatikan Google.
// Per Agustus 2026, "gemini-3.6-flash" adalah model Flash terbaru yang berstatus GA
// (production-ready) dan direkomendasikan resmi oleh Google — gemini-2.5-flash sendiri
// akan pensiun 16 Okt 2026, jadi langsung pakai generasi 3.x lebih aman untuk jangka panjang.
// Kalau suatu saat model ini juga di-deprecate, cek daftar model terbaru di
// https://ai.google.dev/gemini-api/docs/models dan tinggal ganti string di bawah ini.
export const GEMINI_MODEL = "gemini-3.6-flash";

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
- Kalau pertanyaan user ambigu, boleh tanya balik singkat, tapi kalau bisa diasumsikan dengan wajar, langsung bantu.`;

export interface GeminiHistoryItem {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function askGemini(history: GeminiHistoryItem[], newMessage: string) {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessage(newMessage);
  return result.response.text();
}

// Versi streaming: mengembalikan potongan teks (chunk) satu per satu begitu Gemini
// selesai men-generate-nya, bukan menunggu jawaban lengkap. Ini yang dipakai buat efek
// "AI sedang mengetik" secara real (bukan animasi pura-pura di frontend).
export async function* askGeminiStream(history: GeminiHistoryItem[], newMessage: string) {
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT
  });

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(newMessage);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
