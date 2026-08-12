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
