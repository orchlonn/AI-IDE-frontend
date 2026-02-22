"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

type Props = {
  content: string;
  isDark?: boolean;
};

export default function ChatMarkdown({ content, isDark = true }: Props) {
  return (
    <div className="chat-markdown text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (match) {
              return (
                <CodeBlock
                  code={codeString}
                  language={match[1]}
                  isDark={isDark}
                />
              );
            }

            return (
              <code
                className="rounded bg-[var(--code-block-bg)] px-1.5 py-0.5 text-xs font-mono text-[var(--accent)]"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-2 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="mb-2 ml-4 list-disc space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return (
              <ol className="mb-2 ml-4 list-decimal space-y-1">{children}</ol>
            );
          },
          li({ children }) {
            return <li>{children}</li>;
          },
          strong({ children }) {
            return <strong className="font-semibold">{children}</strong>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-[var(--accent)] underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          h1({ children }) {
            return <h1 className="mb-2 text-base font-bold">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="mb-2 text-sm font-bold">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="mb-1 text-sm font-semibold">{children}</h3>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function parseFileHint(code: string): { filePath?: string; cleanCode: string } {
  const match = code.match(/^\/\/\s*file:\s*(.+)\n/);
  if (match) {
    return { filePath: match[1].trim(), cleanCode: code.replace(match[0], "") };
  }
  return { cleanCode: code };
}

function CodeBlock({
  code,
  language,
  isDark = true,
}: {
  code: string;
  language: string;
  isDark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const { filePath, cleanCode } = parseFileHint(code);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 overflow-hidden rounded-lg border border-[var(--border)]">
      <div className="flex items-center justify-between bg-[var(--sidebar-bg)] px-3 py-1.5">
        <span className="text-xs text-[var(--muted,#8b949e)]">
          {filePath ? filePath : language}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded px-2 py-0.5 text-xs text-[var(--muted,#8b949e)] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        language={language}
        style={isDark ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          fontSize: "12px",
          background: "var(--code-block-bg)",
        }}
      >
        {cleanCode}
      </SyntaxHighlighter>
    </div>
  );
}
