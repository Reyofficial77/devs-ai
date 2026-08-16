"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import type { ChatRow } from "@/lib/types";
import { Menu } from "lucide-react";

interface Props {
  user: { email: string; name: string; avatarUrl: string | null };
  chats: ChatRow[];
  children: React.ReactNode;
}

export default function ChatLayoutClient({ user, chats, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-app flex bg-white dark:bg-night overflow-hidden">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        chats={chats}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile: cuma muncul di HP buat buka sidebar */}
        <div className="md:hidden flex items-center gap-3 h-13 px-3 py-2.5 border-b border-surface-border dark:border-night-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-soft dark:hover:bg-night-soft text-ink dark:text-white"
            aria-label="Buka menu"
          >
            <Menu size={19} />
          </button>
          <span className="text-sm font-semibold text-ink dark:text-white">Devs AI</span>
        </div>

        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </div>
  );
}
