import { describe, it, expect } from "vitest";
import { getThinkingBudget } from "@/lib/gemini";

describe("getThinkingBudget", () => {
  it("prompt sangat pendek/simpel → budget 0 (langsung jawab, gak perlu mikir lama)", () => {
    expect(getThinkingBudget("halo")).toBe(0);
    expect(getThinkingBudget("makasih ya")).toBe(0);
  });

  it("prompt pendek tapi berupa pertanyaan → budget kecil", () => {
    const budget = getThinkingBudget("Cara pakai RemoteEvent gimana?");
    expect(budget).toBeGreaterThan(0);
    expect(budget).toBeLessThanOrEqual(1024);
  });

  it("prompt menengah → budget menengah", () => {
    const prompt =
      "Tolong buatkan script sederhana buat nampilin currency player di leaderboard, " +
      "pakai IntValue dan update tiap player dapat koin.";
    const budget = getThinkingBudget(prompt);
    expect(budget).toBeGreaterThan(512);
    expect(budget).toBeLessThan(8192);
  });

  it("prompt panjang & kompleks (banyak requirement) → budget besar", () => {
    const prompt =
      "Buatkan sistem lengkap: Rebirth dengan 5 area, tiap area ngalikan income, " +
      "sistem DataStore buat nyimpen progress, UI shop buat beli upgrade, " +
      "leaderboard global, dan sistem anti-exploit dasar buat semua RemoteEvent-nya. " +
      "Jelasin juga cara integrasi semuanya biar gak konflik satu sama lain.";
    const budget = getThinkingBudget(prompt);
    expect(budget).toBeGreaterThanOrEqual(8192);
  });

  it("budget selalu bilangan bulat non-negatif", () => {
    const samples = ["", "a", "x".repeat(2000), "buatkan game roblox lengkap dengan banyak sistem"];
    for (const s of samples) {
      const budget = getThinkingBudget(s);
      expect(Number.isInteger(budget)).toBe(true);
      expect(budget).toBeGreaterThanOrEqual(0);
    }
  });
});
