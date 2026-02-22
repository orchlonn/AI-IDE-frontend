"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import dynamic from "next/dynamic";
import type { TerminalHandle } from "@/components/Terminal";
import type { FileNode } from "@/types";
import type { TerminalColors } from "@/lib/themes";
import WelcomeScreen from "./WelcomeScreen";

const Terminal = dynamic(() => import("@/components/Terminal"), { ssr: false });

export default function EditorArea({
  currentFileName,
  language,
  canRun,
  code,
  selectedPath,
  monacoTheme,
  fileTree,
  onEditorMount,
  onCodeChange,
  onFormat,
  onRunFile,
  onUploadFiles,
  onUploadFolder,
  terminalOpen,
  terminalHeight,
  terminalRef,
  pendingRunCommand,
  pendingRunFile,
  terminalColors,
  onCloseTerminal,
  onTerminalResizeStart,
}: {
  currentFileName: string;
  language: string;
  canRun: boolean;
  code: string;
  selectedPath: string;
  monacoTheme: string;
  fileTree: FileNode[];
  onEditorMount: OnMount;
  onCodeChange: (code: string) => void;
  onFormat: () => void;
  onRunFile: () => void;
  onUploadFiles: () => void;
  onUploadFolder: () => void;
  terminalOpen: boolean;
  terminalHeight: number;
  terminalRef: React.RefObject<TerminalHandle | null>;
  pendingRunCommand: string | null;
  pendingRunFile: { name: string; content: string } | null;
  terminalColors: TerminalColors;
  onCloseTerminal: () => void;
  onTerminalResizeStart: (e: React.MouseEvent) => void;
}) {
  return (
    <main className="flex flex-1 flex-col min-w-0 min-h-0">
      {/* Editor toolbar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--editor-bg)] px-3">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">
            {currentFileName}
          </span>
          <span className="rounded bg-[var(--hover-bg)] px-2 py-0.5 text-xs text-[#8b949e]">
            {language}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded px-2 py-1 text-xs text-[#8b949e] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onFormat}
            className="rounded px-2 py-1 text-xs text-[#8b949e] transition-colors hover:bg-[var(--hover-bg)] hover:text-[var(--foreground)]"
          >
            Format
          </button>
          {canRun && (
            <button
              type="button"
              onClick={onRunFile}
              className="flex items-center gap-1 rounded bg-[#238636] px-2.5 py-1 text-xs text-white transition-colors hover:bg-[#2ea043]"
              title="Run file"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run
            </button>
          )}
        </div>
      </div>

      {/* Monaco Editor / Diff Editor / Welcome */}
      <div className="flex-1 min-h-0">
        {fileTree.length === 0 ? (
          <WelcomeScreen onUploadFiles={onUploadFiles} onUploadFolder={onUploadFolder} />
        ) : (
          <Editor
            theme={monacoTheme}
            language={language}
            path={selectedPath}
            value={code}
            onChange={(value) => onCodeChange(value ?? "")}
            onMount={onEditorMount}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
              lineNumbersMinChars: 4,
              automaticLayout: true,
            }}
          />
        )}
      </div>

      {/* Terminal Panel */}
      {terminalOpen && (
        <>
          <div
            className="h-1 shrink-0 cursor-row-resize bg-[var(--border)] hover:bg-[var(--accent)] transition-colors"
            onMouseDown={onTerminalResizeStart}
          />
          <div className="shrink-0" style={{ height: terminalHeight }}>
            <Terminal
              ref={terminalRef}
              onClose={onCloseTerminal}
              initialCommand={pendingRunCommand}
              initialFile={pendingRunFile}
              terminalColors={terminalColors}
            />
          </div>
        </>
      )}
    </main>
  );
}
