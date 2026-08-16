"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Github, Mail, Loader2, Sparkles } from "lucide-react";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");

  async function handleOAuth(provider: "google" | "github") {
    setLoading(provider);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteUrl}/auth/callback` }
    });
    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(null);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading("email");
    setMessage(null);

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage({ type: "error", text: error.message });
      else window.location.href = "/chat";
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${siteUrl}/auth/callback` }
      });
      if (error) setMessage({ type: "error", text: error.message });
      else setMessage({ type: "info", text: "Cek email kamu untuk konfirmasi akun sebelum login." });
    }
    setLoading(null);
  }

  return (
    <div className="min-h-dvh h-app overflow-y-auto flex items-center justify-center bg-surface-soft dark:bg-night px-4">
      <div className="w-full max-w-sm animate-fadeIn">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="w-11 h-11 rounded-xl2 bg-brand-500 dark:bg-violet-500 flex items-center justify-center shadow-panel">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-semibold text-ink dark:text-white">Devs AI</h1>
          <p className="text-sm text-ink-soft dark:text-violet-200/60 text-center">
            Asisten AI untuk Developer Roblox
          </p>
        </div>

        <div className="bg-white dark:bg-night-soft border border-surface-border dark:border-night-border rounded-xl2 shadow-panel dark:shadow-panelDark p-6">
          <div className="flex flex-col gap-2.5 mb-5">
            <button
              onClick={() => handleOAuth("google")}
              disabled={!!loading}
              className="flex items-center justify-center gap-2.5 w-full h-11 rounded-xl border border-surface-border dark:border-night-border bg-white dark:bg-night text-sm font-medium text-ink dark:text-white hover:bg-surface-soft dark:hover:bg-night-muted transition-colors disabled:opacity-60"
            >
              {loading === "google" ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Lanjut dengan Google
            </button>
            <button
              onClick={() => handleOAuth("github")}
              disabled={!!loading}
              className="flex items-center justify-center gap-2.5 w-full h-11 rounded-xl border border-surface-border dark:border-night-border bg-white dark:bg-night text-sm font-medium text-ink dark:text-white hover:bg-surface-soft dark:hover:bg-night-muted transition-colors disabled:opacity-60"
            >
              {loading === "github" ? <Loader2 size={17} className="animate-spin" /> : <Github size={17} />}
              Lanjut dengan GitHub
            </button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px flex-1 bg-surface-border dark:bg-night-border" />
            <span className="text-xs text-ink-soft dark:text-violet-200/40">atau pakai email</span>
            <div className="h-px flex-1 bg-surface-border dark:bg-night-border" />
          </div>

          <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="Alamat email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 px-3.5 rounded-xl border border-surface-border dark:border-night-border bg-white dark:bg-night text-sm text-ink dark:text-white placeholder:text-ink-soft/50 dark:placeholder:text-violet-200/30 outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-violet-400 transition-shadow"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Kata sandi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 px-3.5 rounded-xl border border-surface-border dark:border-night-border bg-white dark:bg-night text-sm text-ink dark:text-white placeholder:text-ink-soft/50 dark:placeholder:text-violet-200/30 outline-none focus:ring-2 focus:ring-brand-400 dark:focus:ring-violet-400 transition-shadow"
            />
            <button
              type="submit"
              disabled={!!loading}
              className="flex items-center justify-center gap-2 h-11 rounded-xl bg-brand-500 dark:bg-violet-500 text-white text-sm font-medium hover:bg-brand-600 dark:hover:bg-violet-600 transition-colors disabled:opacity-60"
            >
              {loading === "email" ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Mail size={16} />
              )}
              {mode === "signin" ? "Masuk" : "Daftar"}
            </button>
          </form>

          {message && (
            <p
              className={`mt-3 text-xs text-center ${
                message.type === "error" ? "text-red-500" : "text-brand-600 dark:text-violet-300"
              }`}
            >
              {message.text}
            </p>
          )}

          <p className="mt-5 text-center text-xs text-ink-soft dark:text-violet-200/50">
            {mode === "signin" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setMessage(null);
              }}
              className="text-brand-600 dark:text-violet-300 font-medium hover:underline"
            >
              {mode === "signin" ? "Daftar di sini" : "Masuk di sini"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.5 0-14 4.2-17.7 10.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.1 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.9 39.7 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.6C41.4 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
