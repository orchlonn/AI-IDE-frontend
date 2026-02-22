"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { ChatMessage } from "@/types";

export function useChat(
  projectId: string | null,
  selectedPath: string,
  code: string,
  onApplyCode?: (code: string, filePath?: string) => void,
) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef("");
  const rafRef = useRef<number | null>(null);
  const aiMsgIdRef = useRef<string>("");

  const flushStreaming = useCallback(() => {
    const text = streamingRef.current;
    const id = aiMsgIdRef.current;
    setChatMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: text } : m)),
    );
    rafRef.current = null;
  }, []);

  const sendChat = useCallback(async () => {
    const question = chatInput.trim();
    if (!question || !projectId || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: question,
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "ai",
      content: "",
    };
    aiMsgIdRef.current = aiMsg.id;
    streamingRef.current = "";
    setChatMessages((prev) => [...prev, aiMsg]);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          question,
          history: chatMessages.map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
          current_file: selectedPath ? { path: selectedPath, content: code } : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsg.id
              ? { ...m, content: `Error: ${err.error || "Something went wrong"}` }
              : m,
          ),
        );
        setChatLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          streamingRef.current += decoder.decode(value, { stream: true });
          if (rafRef.current === null) {
            rafRef.current = requestAnimationFrame(flushStreaming);
          }
        }
        // Final flush to ensure all content is rendered
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        flushStreaming();
      }
    } catch {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsg.id
            ? { ...m, content: "Error: Failed to connect to AI." }
            : m,
        ),
      );
    }

    // Auto-apply code blocks from the response
    if (onApplyCode && streamingRef.current) {
      const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
      let match;
      while ((match = codeBlockRegex.exec(streamingRef.current)) !== null) {
        const blockContent = match[1];
        const fileHint = blockContent.match(/^\/\/\s*file:\s*(.+)\n/);
        if (fileHint) {
          const filePath = fileHint[1].trim();
          const cleanCode = blockContent.replace(fileHint[0], "");
          onApplyCode(cleanCode, filePath);
        }
      }
    }

    setChatLoading(false);
  }, [chatInput, projectId, chatLoading, chatMessages, selectedPath, code, flushStreaming, onApplyCode]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  return {
    chatMessages, chatInput, setChatInput,
    chatLoading, chatEndRef, sendChat,
  };
}
