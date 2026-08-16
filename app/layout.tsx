import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devs AI — Asisten AI untuk Developer Roblox",
  description: "AI khusus buat bantu Developer Roblox: nulis script Luau, ngajarin sistem game, dan generate file kode yang bisa langsung didownload."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Ini kuncinya: minta browser (Chrome Android & browser modern lain yang
  // support) buat BENERAN mengecilkan layout viewport (bukan cuma nutupin
  // konten) waktu keyboard mobile muncul. Dengan ini, unit "dvh" jadi akurat
  // secara native tanpa perlu hitungan manual JS yang riskan salah hitung.
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#131320" }
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
