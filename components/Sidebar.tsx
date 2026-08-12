"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import type { ChatRow } from "@/lib/types";
import { Plus, MessageSquare, Sun, Moon, LogOut, X, Sparkles, Trash2 } from "lucide-react";

interface Props {
  user: { email: string; name: string; avatarUrl: string | null };
  chats: ChatRow[];
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ user, chats, open, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const supabase = createClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function handleDelete(e: React.MouseEvent, chatId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Hapus percakapan ini? Tindakan ini tidak bisa dibatalkan.")) return;

    setDeletingId(chatId);
    const res = await fetch(`/api/chats/${chatId}`, { method: "DELETE" });
    setDeletingId(null);

    if (res.ok) {
      // Kalau yang dihapus adalah chat yang sedang dibuka, pindah ke halaman chat baru.
      if (pathname === `/chat/${chatId}`) {
        router.replace("/chat");
      }
      router.refresh();
    }
  }

  return (
    <aside
      className={`
        fixed md:static z-40 inset-y-0 left-0 w-72 shrink-0
        bg-surface-soft dark:bg-night-soft border-r border-surface-border dark:border-night-border
        flex flex-col transition-transform duration-200 ease-out
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
    >
      <div className="flex items-center justify-between px-4 h-14 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 dark:bg-violet-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-ink dark:text-white">Devs AI</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-muted dark:hover:bg-night-muted text-ink dark:text-white"
        >
          <X size={17} />
        </button>
      </div>

      <div className="px-3">
        <Link
          href="/chat"
          onClick={onClose}
          className="flex items-center gap-2 h-10 px-3 rounded-xl border border-surface-border dark:border-night-border bg-white dark:bg-night text-sm font-medium text-ink dark:text-white hover:border-brand-300 dark:hover:border-violet-400 transition-colors"
        >
          <Plus size={16} />
          Chat Baru
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 mt-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-soft/60 dark:text-violet-200/40 px-2 mb-1.5">
          Riwayat
        </p>
        <div className="flex flex-col gap-0.5">
          {chats.length === 0 && (
            <p className="text-xs text-ink-soft dark:text-violet-200/40 px-2 py-3">
              Belum ada percakapan.
            </p>
          )}
          {chats.map((chat) => {
            const active = pathname === `/chat/${chat.id}`;
            return (
              <Link
                key={chat.id}
                href={`/chat/${chat.id}`}
                onClick={onClose}
                className={`
                  group flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm truncate transition-colors
                  ${
                    active
                      ? "bg-brand-50 dark:bg-violet-500/15 text-brand-700 dark:text-violet-200 font-medium"
                      : "text-ink dark:text-white/85 hover:bg-surface-muted dark:hover:bg-night-muted"
                  }
                `}
              >
                <MessageSquare size={14} className="shrink-0 opacity-60" />
                <span className="truncate flex-1">{chat.title || "Percakapan baru"}</span>
                <button
                  onClick={(e) => handleDelete(e, chat.id)}
                  disabled={deletingId === chat.id}
                  className="shrink-0 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-100 dark:hover:bg-red-500/15 hover:text-red-500 transition-opacity disabled:opacity-50"
                  aria-label="Hapus percakapan"
                >
                  <Trash2 size={13} />
                </button>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t border-surface-border dark:border-night-border flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-violet-500/25 flex items-center justify-center text-xs font-semibold text-brand-700 dark:text-violet-200 overflow-hidden shrink-0">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-ink dark:text-white truncate">{user.name}</p>
          <p className="text-[11px] text-ink-soft dark:text-violet-200/40 truncate">{user.email}</p>
        </div>
        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-muted dark:hover:bg-night-muted text-ink dark:text-white shrink-0"
          aria-label="Ganti tema"
        >
          {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-ink dark:text-white hover:text-red-500 shrink-0 disabled:opacity-50"
          aria-label="Keluar"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
