import { describe, it, expect } from "vitest";
import {
  extractCodeFiles,
  stripProjectMemoryMarker,
  extractProjectMemory
} from "@/lib/utils/codeParser";

describe("extractCodeFiles", () => {
  it("mengambil file dari code block yang punya title", () => {
    const markdown = [
      'Ini scriptnya:',
      '```lua title="RebirthSystem.server.lua"',
      "print('hello')",
      "```"
    ].join("\n");

    const files = extractCodeFiles(markdown);

    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe("RebirthSystem.server.lua");
    expect(files[0].language).toBe("lua");
    expect(files[0].content).toBe("print('hello')");
  });

  it("mengabaikan code block yang tidak punya title (contoh singkat)", () => {
    const markdown = ["```lua", "local x = 1", "```"].join("\n");
    expect(extractCodeFiles(markdown)).toHaveLength(0);
  });

  it("mendukung beberapa file sekaligus dalam satu balasan", () => {
    const markdown = [
      '```lua title="A.lua"',
      "-- a",
      "```",
      "Penjelasan di tengah.",
      '```lua title="B.lua"',
      "-- b",
      "```"
    ].join("\n");

    const files = extractCodeFiles(markdown);
    expect(files.map((f) => f.filename)).toEqual(["A.lua", "B.lua"]);
  });

  it("mengembalikan array kosong kalau tidak ada code block sama sekali", () => {
    expect(extractCodeFiles("Cuma teks biasa, gak ada kode.")).toEqual([]);
  });
});

describe("stripProjectMemoryMarker & extractProjectMemory", () => {
  const textWithMarker =
    'Oke, aku sudah paham gambaran project kamu.\n\n' +
    '{{DEVSAI_SAVE_PROJECT:{"title":"Run For ASMR","details":"Game lari dengan sistem Rebirth."}}}';

  it("stripProjectMemoryMarker menghapus marker & tidak bocor ke tampilan user", () => {
    const result = stripProjectMemoryMarker(textWithMarker);
    expect(result).not.toContain("DEVSAI_SAVE_PROJECT");
    expect(result).toBe("Oke, aku sudah paham gambaran project kamu.");
  });

  it("stripProjectMemoryMarker tidak mengubah teks yang memang tidak ada marker-nya", () => {
    const plain = "Ini balasan biasa tanpa project besar.";
    expect(stripProjectMemoryMarker(plain)).toBe(plain);
  });

  it("extractProjectMemory berhasil parsing title & details dari marker", () => {
    const result = extractProjectMemory(textWithMarker);
    expect(result).toEqual({
      title: "Run For ASMR",
      details: "Game lari dengan sistem Rebirth."
    });
  });

  it("extractProjectMemory return null kalau tidak ada marker", () => {
    expect(extractProjectMemory("Balasan singkat biasa.")).toBeNull();
  });

  it("extractProjectMemory return null (bukan throw) kalau JSON di marker rusak", () => {
    const broken = "{{DEVSAI_SAVE_PROJECT:{title tanpa kutip}}}";
    expect(() => extractProjectMemory(broken)).not.toThrow();
    expect(extractProjectMemory(broken)).toBeNull();
  });
});
