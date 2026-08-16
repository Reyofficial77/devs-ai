import { describe, it, expect } from "vitest";
import { buildSystemPrompt, SYSTEM_PROMPT } from "@/lib/gemini";

describe("buildSystemPrompt", () => {
  it("mengembalikan SYSTEM_PROMPT apa adanya kalau belum ada memori project", () => {
    expect(buildSystemPrompt([])).toBe(SYSTEM_PROMPT);
  });

  it("menyisipkan ringkasan project ke akhir system prompt kalau ada memori tersimpan", () => {
    const result = buildSystemPrompt([
      { title: "Run For ASMR", details: "Game lari dengan sistem Rebirth 3 tingkat." }
    ]);

    expect(result.startsWith(SYSTEM_PROMPT)).toBe(true);
    expect(result).toContain("RINGKASAN PROJECT BESAR USER YANG SUDAH TERSIMPAN");
    expect(result).toContain("Run For ASMR");
    expect(result).toContain("Game lari dengan sistem Rebirth 3 tingkat.");
  });

  it("menampilkan lebih dari satu project kalau user punya beberapa project besar", () => {
    const result = buildSystemPrompt([
      { title: "Game A", details: "Detail A" },
      { title: "Game B", details: "Detail B" }
    ]);

    expect(result).toContain("Game A");
    expect(result).toContain("Game B");
  });
});
