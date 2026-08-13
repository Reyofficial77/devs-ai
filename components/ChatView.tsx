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

type Status = "idle" | "thinking" | "typing";

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
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  async function sendMessage(text: string) {
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setStatus("thinking");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, chatId })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Gagal menghubungi server.");
      }

      const newChatId = res.headers.get("X-Chat-Id");

      if (!res.body) throw new Error("Tidak ada respons dari server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let firstChunk = true;

      // Tambahkan slot pesan AI kosong yang akan terisi progresif (efek mengetik).
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        if (!chunkText) continue;

        if (firstChunk) {
          setStatus("typing");
          firstChunk = false;
        }

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, content: last.content + chunkText };
          return updated;
        });
      }

      // Kalau ini pesan pertama (chat baru dibuat di server), pindah URL ke /chat/[chatId]
      // tanpa reload halaman, dan refresh sidebar biar chat baru muncul di riwayat.
      if (!chatId && newChatId) {
        router.replace(`/chat/${newChatId}`);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan. Coba lagi.");
      setMessages((prev) => prev.slice(0, prev[prev.length - 1]?.content === "" ? -1 : -2));
    } finally {
      setStatus("idle");
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="h-full flex flex-col">
      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 dark:bg-violet-500 flex items-center justify-center mb-4 shadow-panel animate-popIn">
            <Sparkles size={22} className="text-white" />
          </div>
          <h1 className="text-lg font-semibold text-ink dark:text-white mb-1.5 animate-fadeIn">
            Mau bikin apa hari ini?
          </h1>
          <p className="text-sm text-ink-soft dark:text-violet-200/50 mb-6 max-w-sm animate-fadeIn">
            Tanya apa saja soal development Roblox — script Luau, sistem game, sampai debugging.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                style={{ animationDelay: `${i * 60}ms` }}
                className="text-left text-sm px-3.5 py-2.5 rounded-xl border border-surface-border dark:border-night-border hover:border-brand-300 dark:hover:border-violet-400 hover:-translate-y-0.5 hover:shadow-panel dark:hover:shadow-panelDark text-ink dark:text-white/85 transition-all duration-200 animate-fadeIn opacity-0 [animation-fill-mode:forwards]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 md:px-4 py-2">
            {messages.map((m, i) => {
              const isLastAssistant =
                i === messages.length - 1 && m.role === "assistant" && status === "typing";
              return (
                <Message
                  key={i}
                  role={m.role}
                  content={m.content}
                  isStreaming={isLastAssistant}
                />
              );
            })}
            {status === "thinking" && <ThinkingBubble />}
          </div>
          <div ref={bottomRef} />
        </div>
      )}

      {error && (
        <p className="text-center text-xs text-red-500 pb-2 px-4 animate-fadeIn">{error}</p>
      )}

      <ChatInput onSend={sendMessage} disabled={status !== "idle"} />
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-2.5 py-3 animate-bubbleInLeft">
      <div className="w-7 h-7 rounded-lg bg-brand-500 dark:bg-violet-500 flex items-center justify-center shrink-0 mt-0.5 animate-pulseGlow">
        <Sparkles size={14} className="text-white" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-ink-soft dark:text-violet-200/50">Devs AI</p>
        <div className="flex items-center gap-1.5 h-6 px-3.5 rounded-2xl rounded-tl-sm bg-surface-muted dark:bg-night-muted w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-ink-soft/50 dark:bg-violet-200/50 animate-thinkBounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-ink-soft/50 dark:bg-violet-200/50 animate-thinkBounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-ink-soft/50 dark:bg-violet-200/50 animate-thinkBounce" />
        </div>
      </div>
    </div>
  );
}
