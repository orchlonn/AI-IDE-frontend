export type CodeChunk = {
  file_path: string;
  chunk_index: number;
  content: string;
};

const CHUNK_SIZE = 100; // lines per chunk
const OVERLAP = 20; // overlapping lines between chunks

/**
 * Split a file's content into overlapping chunks.
 * Each chunk includes a header with the file path and line range.
 */
export function chunkFile(filePath: string, content: string): CodeChunk[] {
  const lines = content.split("\n");

  // Small files: single chunk
  if (lines.length <= CHUNK_SIZE) {
    return [
      {
        file_path: filePath,
        chunk_index: 0,
        content: `// ${filePath}\n${content}`,
      },
    ];
  }

  const chunks: CodeChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < lines.length) {
    const end = Math.min(start + CHUNK_SIZE, lines.length);
    const slice = lines.slice(start, end).join("\n");
    const header = `// ${filePath} (lines ${start + 1}-${end})`;
    chunks.push({
      file_path: filePath,
      chunk_index: index,
      content: `${header}\n${slice}`,
    });
    index++;
    start += CHUNK_SIZE - OVERLAP;
  }

  return chunks;
}

/**
 * Chunk all files in a project's file_contents map.
 */
export function chunkProject(
  fileContents: Record<string, string>,
): CodeChunk[] {
  const allChunks: CodeChunk[] = [];
  for (const [path, content] of Object.entries(fileContents)) {
    allChunks.push(...chunkFile(path, content));
  }
  return allChunks;
}
