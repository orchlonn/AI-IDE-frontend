"use client";

import { useState, useCallback, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import type { ProjectRow, FileNode } from "@/types";
import { getLanguageFromFileName, MAX_PROJECT_SIZE } from "@/lib/fileUtils";

interface FileManagerSetters {
  setFileTree: (tree: FileNode[]) => void;
  setFileContents: (contents: Map<string, string>) => void;
  setExpandedFolders: (folders: Set<string>) => void;
  setSelectedPath: (path: string) => void;
  setCurrentFileName: (name: string) => void;
  setLanguage: (lang: string) => void;
  setCode: (code: string) => void;
  fileTree: FileNode[];
  fileContents: Map<string, string>;
  code: string;
  selectedPath: string;
}

export function useProject(
  showToast: (message: string, type: "error" | "warning" | "success") => void,
  fileManager: FileManagerSetters,
) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("my-project");
  const [projectList, setProjectList] = useState<
    { id: string; name: string; updated_at: string }[]
  >([]);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [indexing, setIndexing] = useState(false);

  const fetchProjects = useCallback(async () => {
    const { data } = await getSupabase()
      .from("projects")
      .select("id, name, updated_at")
      .order("updated_at", { ascending: false });
    if (data) setProjectList(data);
  }, []);

  const loadProject = useCallback(
    async (id: string) => {
      const { data } = await getSupabase()
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (!data) return;
      const row = data as ProjectRow;
      setProjectId(row.id);
      setProjectName(row.name);
      fileManager.setFileTree(row.file_tree);
      const contents = new Map(Object.entries(row.file_contents));
      fileManager.setFileContents(contents);

      const rootFolders = new Set<string>();
      for (const node of row.file_tree) {
        if (node.type === "folder") rootFolders.add(node.name);
      }
      fileManager.setExpandedFolders(rootFolders);

      const firstPath = Object.keys(row.file_contents)[0];
      if (firstPath) {
        const name = firstPath.split("/").pop() ?? firstPath;
        fileManager.setSelectedPath(firstPath);
        fileManager.setCurrentFileName(name);
        fileManager.setLanguage(getLanguageFromFileName(name));
        fileManager.setCode(row.file_contents[firstPath] ?? "");
      }
      setShowProjectMenu(false);
    },
    [fileManager],
  );

  const indexProject = useCallback(
    async (id: string) => {
      setIndexing(true);
      try {
        const res = await fetch("http://localhost:8000/api/embeddings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: id }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: res.statusText }));
          showToast(
            `Indexing failed: ${err.error || "Unknown error"}`,
            "error",
          );
        }
      } catch {
        showToast("Indexing failed: Could not connect to server", "error");
      }
      setIndexing(false);
    },
    [showToast],
  );

  const saveProject = useCallback(async () => {
    const currentContents = new Map(fileManager.fileContents);
    currentContents.set(fileManager.selectedPath, fileManager.code);

    let totalSize = 0;
    for (const content of currentContents.values()) {
      totalSize += content.length;
    }
    if (totalSize > MAX_PROJECT_SIZE) {
      showToast(
        `Project too large (${(totalSize / 1024 / 1024).toFixed(1)} MB). Max is ${MAX_PROJECT_SIZE / 1024 / 1024} MB. Remove some files and try again.`,
        "error",
      );
      return;
    }

    let name = projectName;
    if (!projectId) {
      const input = prompt("Project name:", projectName);
      if (!input) return;
      name = input;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        file_tree: fileManager.fileTree,
        file_contents: Object.fromEntries(currentContents),
        updated_at: new Date().toISOString(),
      };

      let savedId = projectId;
      if (projectId) {
        const { error } = await getSupabase()
          .from("projects")
          .update(payload)
          .eq("id", projectId);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await getSupabase()
          .from("projects")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        if (data) {
          setProjectId(data.id);
          savedId = data.id;
        }
      }
      setProjectName(name);
      showToast("Project saved", "success");

      if (savedId) indexProject(savedId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      showToast(`Save failed: ${msg}`, "error");
    }
    setSaving(false);
  }, [
    fileManager.fileTree,
    fileManager.fileContents,
    fileManager.code,
    fileManager.selectedPath,
    projectId,
    projectName,
    indexProject,
    showToast,
  ]);

  const deleteProject = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!confirm("Delete this project?")) return;
      await getSupabase().from("projects").delete().eq("id", id);
      if (projectId === id) setProjectId(null);
      fetchProjects();
    },
    [projectId, fetchProjects],
  );

  // Fetch projects when menu opens
  useEffect(() => {
    if (showProjectMenu) fetchProjects();
  }, [showProjectMenu, fetchProjects]);

  // Close project menu on outside click
  useEffect(() => {
    if (!showProjectMenu) return;
    const handler = () => setShowProjectMenu(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [showProjectMenu]);

  return {
    projectId,
    projectName,
    setProjectName,
    projectList,
    showProjectMenu,
    setShowProjectMenu,
    saving,
    indexing,
    fetchProjects,
    loadProject,
    saveProject,
    deleteProject,
    indexProject,
  };
}
