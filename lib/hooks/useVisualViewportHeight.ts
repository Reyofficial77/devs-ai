"use client";

import { useEffect } from "react";

export interface ViewportMetrics {
  height: number;
  offsetTop: number;
}

// Fungsi murni (pure function) — sengaja dipisah dari useEffect di bawah
// supaya bisa di-unit-test tanpa perlu browser/keyboard beneran (lihat
// lib/hooks/__tests__/computeViewportMetrics.test.ts).
//
// visualViewport.offsetTop itu kuncinya: waktu keyboard mobile muncul,
// sebagian browser (terutama Chrome Android) tidak cuma mengecilkan tinggi
// visualViewport, tapi juga MENGGESER posisinya (offsetTop > 0). Kalau cuma
// height yang dipakai (tanpa offsetTop), konten jadi ke-render mulai dari
// y=0 layout viewport — padahal area yang KELIHATAN sudah bergeser turun —
// akibatnya muncul celah kosong di bawah & konten atas seperti "hilang"
// (ini persis bug yang dilaporkan user).
export function computeViewportMetrics(
  visualViewport: VisualViewport | null | undefined,
  fallbackHeight: number
): ViewportMetrics {
  if (!visualViewport) {
    return { height: fallbackHeight, offsetTop: 0 };
  }

  return {
    height: visualViewport.height,
    // Math.max jaga-jaga kalau ada browser yang pernah kasih nilai negatif aneh.
    offsetTop: Math.max(0, visualViewport.offsetTop)
  };
}

// Mengatasi masalah klasik mobile web: waktu keyboard virtual muncul,
// beberapa browser (terutama Chrome Android) tidak mengecilkan viewport
// layout (termasuk unit "dvh") DAN menggeser posisi area yang kelihatan,
// jadi elemen di bawah (misal input chat) bisa ketutup keyboard, atau
// malah muncul celah kosong aneh dengan konten atas yang seolah hilang.
//
// Solusinya: pakai window.visualViewport buat ngukur tinggi & posisi
// (offset) layar yang BENAR-BENAR kelihatan saat ini, simpan ke 2 CSS
// variable (--app-vh dan --app-vh-offset), lalu container utama (class
// .h-app di globals.css) di-posisikan `fixed` dan digeser (translateY)
// sesuai offset itu — jadi selalu pas menempel di area yang kelihatan,
// persis di atas keyboard, tanpa celah.
export function useVisualViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;

    function updateMetrics() {
      const { height, offsetTop } = computeViewportMetrics(
        window.visualViewport,
        window.innerHeight
      );
      root.style.setProperty("--app-vh", `${height}px`);
      root.style.setProperty("--app-vh-offset", `${offsetTop}px`);
    }

    updateMetrics();

    // "resize" nangkep keyboard buka/tutup & rotasi layar.
    // "scroll" nangkep kasus offsetTop berubah waktu keyboard muncul
    // (kadang berubah duluan sebelum event resize kedeteksi).
    window.visualViewport?.addEventListener("resize", updateMetrics);
    window.visualViewport?.addEventListener("scroll", updateMetrics);
    window.addEventListener("orientationchange", updateMetrics);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateMetrics);
      window.visualViewport?.removeEventListener("scroll", updateMetrics);
      window.removeEventListener("orientationchange", updateMetrics);
    };
  }, []);
}
