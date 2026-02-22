"use client";

import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { useLayout } from "@/hooks/useLayout";
import { useFileManager } from "@/hooks/useFileManager";
import { useProject } from "@/hooks/useProject";
import { useChat } from "@/hooks/useChat";
import { useCodeReview } from "@/hooks/useCodeReview";
import { useDragDrop } from "@/hooks/useDragDrop";
import { useTerminalManager } from "@/hooks/useTerminalManager";
import { getRunCommand } from "@/lib/fileUtils";

import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import EditorArea from "@/components/EditorArea";
import RightSidebar from "@/components/RightSidebar";
import StatusBar from "@/components/StatusBar";
import DragOverlay from "@/components/DragOverlay";
import Toast from "@/components/Toast";
import SettingsModal from "@/components/SettingsModal";

export default function Home() {
  const { themeId, currentTheme, selectTheme, allThemes } = useTheme();
  const { toast, showToast, dismissToast } = useToast();
  const layout = useLayout();
  const fileManager = useFileManager(showToast);
  const project = useProject(showToast, fileManager);
  const codeReview = useCodeReview(
    fileManager.selectedPath,
    fileManager.code,
    fileManager.fileContents,
    fileManager.language,
    fileManager.handleCodeChange,
    fileManager.setFileContents,
    showToast,
    {
      setSelectedPath: fileManager.setSelectedPath,
      setCurrentFileName: fileManager.setCurrentFileName,
      setLanguage: fileManager.setLanguage,
      setCode: fileManager.setCode,
    },
  );
  const chat = useChat(
    project.projectId,
    fileManager.selectedPath,
    fileManager.code,
    codeReview.handleApplyCode,
  );
  const dragDrop = useDragDrop(
    fileManager.processFiles,
    fileManager.readFileList,
    fileManager.readEntry,
    showToast,
  );
  const terminal = useTerminalManager(
    fileManager.currentFileName,
    fileManager.language,
    fileManager.code,
    layout.terminalOpen,
    layout.setTerminalOpen,
  );

  return (
    <div
      className="flex h-screen flex-col bg-[var(--background)] text-[var(--foreground)]"
      onDragEnter={dragDrop.handleDragEnter}
      onDragLeave={dragDrop.handleDragLeave}
      onDragOver={dragDrop.handleDragOver}
      onDrop={dragDrop.handleDrop}
    >
      <Header
        projectName={project.projectName}
        showProjectMenu={project.showProjectMenu}
        onToggleProjectMenu={() => project.setShowProjectMenu((p) => !p)}
        projectList={project.projectList}
        projectId={project.projectId}
        onLoadProject={project.loadProject}
        onDeleteProject={project.deleteProject}
        saving={project.saving}
        onSave={project.saveProject}
        onOpenSettings={() => layout.setSettingsOpen(true)}
      />

      <div className="relative flex flex-1 min-h-0">
        <LeftSidebar
          isOpen={layout.leftOpen}
          width={layout.leftWidth}
          projectName={project.projectName}
          fileTree={fileManager.fileTree}
          selectedPath={fileManager.selectedPath}
          expandedFolders={fileManager.expandedFolders}
          fileInputRef={fileManager.fileInputRef}
          folderInputRef={fileManager.folderInputRef}
          onToggle={() => layout.setLeftOpen((v) => !v)}
          onSelectFile={fileManager.selectFile}
          onRenameFile={fileManager.renameFile}
          onToggleFolder={fileManager.toggleFolder}
          onReadFileList={fileManager.readFileList}
          onResizeStart={layout.handleLeftResizeStart}
        />

        <EditorArea
          currentFileName={fileManager.currentFileName}
          language={fileManager.language}
          canRun={
            !!getRunCommand(fileManager.currentFileName, fileManager.language)
          }
          code={fileManager.code}
          selectedPath={fileManager.selectedPath}
          monacoTheme={currentTheme.monacoTheme}
          fileTree={fileManager.fileTree}
          onEditorMount={fileManager.handleEditorMount}
          onCodeChange={fileManager.handleCodeChange}
          onFormat={fileManager.handleFormat}
          onRunFile={terminal.handleRunFile}
          onUploadFiles={() => fileManager.fileInputRef.current?.click()}
          onUploadFolder={() => fileManager.folderInputRef.current?.click()}
          terminalOpen={layout.terminalOpen}
          terminalHeight={layout.terminalHeight}
          terminalRef={terminal.terminalRef}
          pendingRunCommand={terminal.pendingRunCommand}
          pendingRunFile={terminal.pendingRunFile}
          terminalColors={currentTheme.terminal}
          onCloseTerminal={() => layout.setTerminalOpen(false)}
          onTerminalResizeStart={layout.handleTerminalResizeStart}
        />

        <RightSidebar
          isOpen={layout.rightOpen}
          width={layout.rightWidth}
          projectId={project.projectId}
          chatMessages={chat.chatMessages}
          chatInput={chat.chatInput}
          chatLoading={chat.chatLoading}
          indexing={project.indexing}
          chatEndRef={chat.chatEndRef}
          onToggle={() => layout.setRightOpen((v) => !v)}
          onChatInputChange={chat.setChatInput}
          onSendChat={chat.sendChat}
          onResizeStart={layout.handleRightResizeStart}
        />
      </div>

      <DragOverlay visible={dragDrop.dragging} />

      <StatusBar
        saving={project.saving}
        indexing={project.indexing}
        projectId={project.projectId}
        language={fileManager.language}
        terminalOpen={layout.terminalOpen}
        onToggleTerminal={() => layout.setTerminalOpen((v) => !v)}
      />

      <SettingsModal
        isOpen={layout.settingsOpen}
        onClose={() => layout.setSettingsOpen(false)}
        themeId={themeId}
        onSelectTheme={selectTheme}
        allThemes={allThemes}
      />

      <Toast
        toast={toast}
        showUndo={false}
        onUndo={() => dismissToast()}
        onDismiss={dismissToast}
      />
    </div>
  );
}
