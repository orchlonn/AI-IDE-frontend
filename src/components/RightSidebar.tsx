import type { ChatMessage } from "@/types";
import ChatMarkdown from "./ChatMarkdown";

export default function RightSidebar({
  isOpen,
  width,
  projectId,
  chatMessages,
  chatInput,
  chatLoading,
  indexing,
  chatEndRef,
  onToggle,
  onChatInputChange,
  onSendChat,
  onResizeStart,
}: {
  isOpen: boolean;
  width: number;
  projectId: string | null;
  chatMessages: ChatMessage[];
  chatInput: string;
  chatLoading: boolean;
  indexing: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onToggle: () => void;
  onChatInputChange: (value: string) => void;
  onSendChat: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) {
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-0 top-14 z-10 rounded-l border border-r-0 border-[var(--border)] bg-[var(--sidebar-bg)] p-2 text-[#8b949e] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]"
        aria-label="Open AI assistant"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 18l6-6-6-6" />
        </svg>
      </button>
    );
  }

  return (
    <aside
      className="relative flex shrink-0 flex-col border-l border-[var(--border)] bg-[var(--sidebar-bg)] shadow-lg"
      style={{ width }}
    >
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
        <h2 className="text-sm font-semibold">AI Assistant</h2>
        <button
          type="button"
          onClick={onToggle}
          className="rounded p-1 text-[#8b949e] hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)] lg:hidden"
          aria-label="Close chat"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto overflow-x-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-[#8b949e]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="text-sm">
                {projectId ? "Ask a question about your code" : "Save your project first to enable AI chat"}
              </p>
            </div>
          )}
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                  msg.role === "user"
                    ? "bg-[var(--chat-user-bg)] text-[var(--foreground)] rounded-br-md"
                    : "bg-[var(--chat-ai-bg)] text-[#e6edf3] rounded-bl-md"
                }`}
              >
                {msg.role === "ai" ? (
                  <ChatMarkdown content={msg.content} />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {chatLoading && chatMessages[chatMessages.length - 1]?.content === "" && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-[var(--chat-ai-bg)] px-4 py-3 shadow-md">
                <span className="text-sm text-[#8b949e] animate-pulse">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="shrink-0 border-t border-[var(--border)] p-3">
          {indexing && (
            <p className="mb-2 text-xs text-[var(--accent)] animate-pulse">Indexing project for AI...</p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSendChat();
            }}
            className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--editor-bg)] px-3 py-2"
          >
            <input
              type="text"
              placeholder={projectId ? "Ask about this code..." : "Save project to enable chat"}
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              disabled={!projectId || chatLoading}
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[#8b949e] focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!projectId || chatLoading || !chatInput.trim()}
              className="shrink-0 rounded bg-[var(--accent)] p-2 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              aria-label="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      </div>
      <div
        className="absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-[var(--accent)] transition-colors z-10"
        onMouseDown={onResizeStart}
      />
    </aside>
  );
}
