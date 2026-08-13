"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight, oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/components/ThemeProvider";
import { downloadTextFile, downloadFilesAsZip, extractCodeFiles } from "@/lib/utils/codeParser";
import { Download, FileArchive, Sparkles, User } from "lucide-react";
import type { Role } from "@/lib/types";

interface Props {
  role: Role;
  content: string;
  isStreaming?: boolean;
}

export default function Message({ role, content, isStreaming = false }: Props) {
  const { theme } = useTheme();
  const isUser = role === "user";
  const files = !isUser ? extractCodeFiles(content) : [];

  // Selagi masih streaming & belum ada teks sama sekali, biarkan ThinkingBubble
  // di ChatView yang tampil (hindari bubble kosong kedip-kedip).
  if (isStreaming && content.length === 0) return null;

  return (
    <div
      className={`flex gap-2.5 py-2 ${isUser ? "justify-end" : "justify-start"} ${
        isUser ? "animate-bubbleInRight" : "animate-bubbleInLeft"
      }`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-brand-500 dark:bg-violet-500 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={14} className="text-white" />
        </div>
      )}

      <div className={`flex flex-col min-w-0 ${isUser ? "items-end max-w-[85%] sm:max-w-[75%]" : "items-start flex-1 max-w-full"}`}>
        {!isUser && (
          <p className="text-xs font-medium text-ink-soft dark:text-violet-200/50 mb-1 px-1">
            Devs AI
          </p>
        )}

        <div
          className={`
            text-[14.5px] leading-relaxed
            ${
              isUser
                ? "bg-brand-500 dark:bg-violet-500 text-white rounded-2xl rounded-tr-sm px-3.5 py-2.5 whitespace-pre-wrap break-words"
                : "prose-chat text-ink dark:text-white/90 bg-surface-muted/70 dark:bg-night-muted rounded-2xl rounded-tl-sm px-3.5 py-2.5 w-fit max-w-full"
            }
          `}
        >
          {isUser ? (
            content
          ) : (
            <>
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
                      <div className="my-3 rounded-xl overflow-hidden border border-surface-border dark:border-night-border animate-fadeIn">
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
              {isStreaming && (
                <span className="inline-block w-[2px] h-[1em] align-middle bg-brand-500 dark:bg-violet-400 ml-0.5 animate-cursorBlink" />
              )}
            </>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 animate-fadeIn">
            {files.map((file) => (
              <button
                key={file.filename}
                onClick={() => downloadTextFile(file.filename, file.content)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-surface-border dark:border-night-border bg-white dark:bg-night hover:border-brand-300 dark:hover:border-violet-400 hover:-translate-y-0.5 text-ink dark:text-white/85 transition-all"
              >
                <Download size={12} className="text-brand-600 dark:text-violet-300" />
                {file.filename}
              </button>
            ))}
            {files.length > 1 && (
              <button
                onClick={() => downloadFilesAsZip("devs-ai-files.zip", files)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-brand-500 dark:bg-violet-500 text-white hover:bg-brand-600 dark:hover:bg-violet-600 hover:-translate-y-0.5 transition-all"
              >
                <FileArchive size={12} />
                Download semua (.zip)
              </button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-surface-muted dark:bg-night-muted flex items-center justify-center shrink-0 mt-0.5">
          <User size={14} className="text-ink dark:text-white" />
        </div>
      )}
    </div>
  );
}
