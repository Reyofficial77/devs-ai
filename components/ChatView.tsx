"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Message from "@/components/Message";
import ChatInput from "@/components/ChatInput";
import type { MessageRow, Role } from "@/lib/types";
import { Sparkles } from "lucide-react";

interface LocalMessage {
  role: Role;
  content: string;
}

interface Props {
  chatId: string | null;
  initialMessages: MessageRow[];
}

const SUGGESTIONS = [
  "Buatkan sistem Rebirth lengkap pakai DataStore",
  "Jelaskan cara pakai RemoteEvent yang aman dari exploit",
  "Buatkan script Leaderboard (Currency) sederhana",
  "Cara bikin ProximityPrompt untuk buka pintu"
];

export default function ChatView({ chatId, initialMessages }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<LocalMessage[]>(
    initialMessages.map((m) => ({ role: m.role, content: m.content }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, chatId })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal menghubungi server.");

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);

      // Kalau ini pesan pertama (chat baru dibuat di server), pindah URL ke /chat/[chatId]
      // tanpa reload halaman, dan refresh sidebar biar chat baru muncul di riwayat.
      if (!chatId && data.chatId) {
        router.replace(`/chat/${data.chatId}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full flex flex-col">
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 dark:bg-violet-500 flex items-center justify-center mb-4 shadow-panel">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-ink dark:text-white mb-1.5">
            Mau bikin apa hari ini?
          </h1>
          <p className="text-sm text-ink-soft dark:text-violet-200/50 mb-6 max-w-sm">
            Tanya apa saja soal development Roblox — script Luau, sistem game, sampai debugging.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-left text-sm px-3.5 py-2.5 rounded-xl border border-surface-border dark:border-night-border hover:border-brand-300 dark:hover:border-violet-400 text-ink dark:text-white/85 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-0 divide-y divide-surface-border/60 dark:divide-night-border/60">
            {messages.map((m, i) => (
              <Message key={i} role={m.role} content={m.content} />
            ))}
            {loading && (
              <div className="flex gap-3 py-4">
                <div className="w-7 h-7 rounded-lg bg-brand-500 dark:bg-violet-500 flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-white animate-pulse" />
                </div>
                <div className="flex items-center gap-1 pt-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-soft/40 dark:bg-violet-200/40 animate-blink" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-ink-soft/40 dark:bg-violet-200/40 animate-blink"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-ink-soft/40 dark:bg-violet-200/40 animate-blink"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      {error && (
        <p className="text-center text-xs text-red-500 pb-2 px-4">{error}</p>
      )}

      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
