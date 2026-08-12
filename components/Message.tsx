"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/components/ThemeProvider";
import { downloadTextFile, downloadFilesAsZip, extractCodeFiles } from "@/lib/utils/codeParser";
import { Download, FileArchive, Sparkles, User } from "lucide-react";
import type { Role } from "@/lib/types";

export default function Message({ role, content }: { role: Role; content: string }) {
  const { theme } = useTheme();
  const isUser = role === "user";
  const files = !isUser ? extractCodeFiles(content) : [];

  return (
    <div className={`flex gap-3 py-4 ${isUser ? "" : ""}`}>
      <div
        className={`
          w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5
          ${isUser ? "bg-surface-muted dark:bg-night-muted" : "bg-brand-500 dark:bg-violet-500"}
        `}
      >
        {isUser ? (
          <User size={14} className="text-ink dark:text-white" />
        ) : (
          <Sparkles size={14} className="text-white" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink-soft dark:text-violet-200/50 mb-1">
          {isUser ? "Kamu" : "Devs AI"}
        </p>

        <div className="prose-chat text-[14.5px] text-ink dark:text-white/90">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");
                const isBlock = className?.includes("language-");

                if (!isBlock) {
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <div className="my-3 rounded-xl overflow-hidden border border-surface-border dark:border-night-border">
                    <div className="flex items-center justify-between px-3.5 py-2 bg-surface-muted dark:bg-night-muted">
                      <span className="text-[11px] font-mono text-ink-soft dark:text-violet-200/50">
                        {match?.[1] || "code"}
                      </span>
                      <button
                        onClick={() => downloadTextFile(`snippet.${match?.[1] || "txt"}`, codeString)}
                        className="flex items-center gap-1 text-[11px] text-ink-soft dark:text-violet-200/50 hover:text-brand-600 dark:hover:text-violet-300 transition-colors"
                      >
                        <Download size={12} /> Salin sebagai file
                      </button>
                    </div>
                    <SyntaxHighlighter
                      language={match?.[1] || "text"}
                      style={theme === "dark" ? oneDark : oneLight}
                      customStyle={{
                        margin: 0,
                        padding: "0.85rem 1rem",
                        fontSize: "12.5px",
                        background: theme === "dark" ? "#191928" : "#FFFFFF",
                        lineHeight: 1.55
                      }}
                      codeTagProps={{ style: { fontFamily: "var(--font-mono)" } }}
                    >
                      {codeString}
                    </SyntaxHighlighter>
                  </div>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {files.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {files.map((file) => (
              <button
                key={file.filename}
                onClick={() => downloadTextFile(file.filename, file.content)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-surface-border dark:border-night-border bg-white dark:bg-night hover:border-brand-300 dark:hover:border-violet-400 text-ink dark:text-white/85 transition-colors"
              >
                <Download size={12} className="text-brand-600 dark:text-violet-300" />
                {file.filename}
              </button>
            ))}
            {files.length > 1 && (
              <button
                onClick={() => downloadFilesAsZip("devs-ai-files.zip", files)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-brand-500 dark:bg-violet-500 text-white hover:bg-brand-600 dark:hover:bg-violet-600 transition-colors"
              >
                <FileArchive size={12} />
                Download semua (.zip)
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
