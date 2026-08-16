import type { CodeFile } from "@/lib/types";

// Cari semua code block ```lang title="Nama.ext" ... ``` di dalam teks jawaban AI.
// Dipakai buat nampilin tombol download di bawah tiap code block yang punya title.
const CODE_BLOCK_REGEX = /```(\w+)?(?:\s+title="([^"]+)")?\n([\s\S]*?)```/g;

export function extractCodeFiles(markdown: string): CodeFile[] {
  const files: CodeFile[] = [];
  let match: RegExpExecArray | null;

  // reset lastIndex karena regex ini bersifat global & stateful
  CODE_BLOCK_REGEX.lastIndex = 0;

  while ((match = CODE_BLOCK_REGEX.exec(markdown)) !== null) {
    const [, language, title, content] = match;
    if (title) {
      files.push({
        filename: title.trim(),
        language: language || "txt",
        content: content.replace(/\n$/, "")
      });
    }
  }

  return files;
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadFilesAsZip(zipName: string, files: CodeFile[]) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.filename, file.content);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName.endsWith(".zip") ? zipName : `${zipName}.zip`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// =========================================================
// Marker penyimpanan memori project besar.
// Format dari AI: {{DEVSAI_SAVE_PROJECT:{"title":"...","details":"..."}}}
// Selalu ditaruh AI di baris paling akhir balasan, dan harus disembunyikan
// dari tampilan user (dipakai di Message.tsx) sekaligus diparsing di backend
// (dipakai di app/api/chat/route.ts) buat disimpan ke tabel project_memory.
// =========================================================
const SAVE_PROJECT_REGEX = /\{\{DEVSAI_SAVE_PROJECT:(\{[\s\S]*?\})\}\}/;

export interface ParsedProjectMemory {
  title: string;
  details: string;
}

// Menghapus marker dari teks, buat ditampilkan ke user (dipakai di Message.tsx).
export function stripProjectMemoryMarker(text: string): string {
  return text.replace(SAVE_PROJECT_REGEX, "").trim();
}

// Mengekstrak data project dari teks (kalau ada), buat disimpan ke database.
// Dipakai di backend setelah stream selesai & fullText sudah lengkap.
export function extractProjectMemory(text: string): ParsedProjectMemory | null {
  const match = text.match(SAVE_PROJECT_REGEX);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1]);
    if (typeof parsed.title === "string" && typeof parsed.details === "string") {
      return { title: parsed.title.trim(), details: parsed.details.trim() };
    }
    return null;
  } catch {
    // JSON tidak valid (AI kadang bisa salah format) — abaikan saja,
    // jangan sampai bikin seluruh request gagal cuma gara-gara ini.
    return null;
  }
}
