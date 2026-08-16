"use client";

import { useEffect } from "react";

// Mengatasi masalah klasik mobile web: waktu keyboard virtual muncul,
// beberapa browser (terutama Chrome Android) tidak mengecilkan viewport
// layout (termasuk unit "dvh"), jadi elemen yang nempel di bawah
// (misal input chat) ketutup keyboard karena browser mengira layar
// masih setinggi semula.
//
// Solusinya: pakai window.visualViewport (API browser yang memang
// didesain buat kasus ini) buat ngukur tinggi layar yang BENAR-BENAR
// kelihatan saat ini, lalu simpan ke CSS variable --app-vh. Variable ini
// dipakai sebagai tinggi container utama, jadi otomatis ikut menyusut
// begitu keyboard muncul, dan balik normal begitu keyboard ditutup.
export function useVisualViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;

    function updateHeight() {
      const vh = window.visualViewport?.height ?? window.innerHeight;
      root.style.setProperty("--app-vh", `${vh}px`);
    }

    updateHeight();

    // "resize" nangkep keyboard buka/tutup & rotasi layar.
    // "scroll" nangkep kasus di sebagian browser Android waktu keyboard
    // muncul, visualViewport ikut ke-scroll dulu sebelum resize kedeteksi.
    window.visualViewport?.addEventListener("resize", updateHeight);
    window.visualViewport?.addEventListener("scroll", updateHeight);
    window.addEventListener("orientationchange", updateHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.visualViewport?.removeEventListener("scroll", updateHeight);
      window.removeEventListener("orientationchange", updateHeight);
    };
  }, []);
}
