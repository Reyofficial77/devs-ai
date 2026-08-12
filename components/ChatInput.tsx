"use client";

import { useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(resize);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="px-3 pb-3 md:px-6 md:pb-6 pt-2 shrink-0">
      <div className="max-w-3xl mx-auto flex items-end gap-2 rounded-2xl border border-surface-border dark:border-night-border bg-white dark:bg-night-soft shadow-panel dark:shadow-panelDark px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-brand-400 dark:focus-within:ring-violet-400 transition-shadow">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Tanya soal script Luau, sistem game, atau apapun soal Roblox dev..."
          className="flex-1 resize-none bg-transparent outline-none text-[14.5px] text-ink dark:text-white placeholder:text-ink-soft/50 dark:placeholder:text-violet-200/30 max-h-40 leading-relaxed py-1"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="w-9 h-9 shrink-0 rounded-xl bg-brand-500 dark:bg-violet-500 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-600 dark:hover:bg-violet-600 transition-colors"
          aria-label="Kirim"
        >
          {disabled ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
        </button>
      </div>
      <p className="text-center text-[11px] text-ink-soft/60 dark:text-violet-200/30 mt-2">
        Devs AI bisa saja salah. Selalu cek ulang script sebelum dipakai di production.
      </p>
    </form>
  );
}
