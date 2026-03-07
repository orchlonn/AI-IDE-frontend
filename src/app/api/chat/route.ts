import { NextRequest } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getOpenAI } from "@/lib/openai";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const { project_id, question, history, current_file } = await req.json();
    if (!project_id || !question) {
      return new Response(
        JSON.stringify({ error: "Missing project_id or question" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = getSupabase();
    const openai = getOpenAI();

    // Embed the question via backend
    const embRes = await fetch(`${BACKEND_URL}/api/embed-query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: question }),
    });
    if (!embRes.ok) {
      throw new Error(`Embed query failed: ${embRes.statusText}`);
    }
    const { embedding: queryEmbedding } = await embRes.json();

    // Retrieve relevant chunks via pgvector similarity search
    const { data: matches, error: matchErr } = await supabase.rpc(
      "match_code_chunks",
      {
        query_embedding: queryEmbedding,
        match_project_id: project_id,
        match_threshold: 0.3,
        match_count: 8,
      },
    );

    if (matchErr) {
      return new Response(
        JSON.stringify({ error: `Search failed: ${matchErr.message}` }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Build context from matched chunks
    const context = (matches ?? [])
      .map(
        (m: { file_path: string; content: string; similarity: number }) =>
          m.content,
      )
      .join("\n\n---\n\n");

    // Build system prompt with code context and current file
    let systemContent = `You are a helpful coding assistant. Answer the user's question based on the code context provided below. If the context doesn't contain relevant information, say so honestly.

When the user asks you to modify, edit, fix, or create code:
- Always provide the COMPLETE file content in a code block (not just a snippet)
- Add \`// file: <filepath>\` as the very first line of the code block so the system knows which file to update
- If modifying the currently open file, use its path
- If the user asks for changes to a specific file, use that file's path`;

    if (current_file?.path && current_file?.content) {
      systemContent += `\n\n## Currently Open File: ${current_file.path}\n${current_file.content}`;
    }

    if (context) {
      systemContent += `\n\n## Related Code Context\n${context}`;
    }

    // Build messages with conversation history
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemContent },
    ];

    // Add conversation history (limit to last 20 messages to stay within token limits)
    if (Array.isArray(history)) {
      const recentHistory = history.slice(-20);
      for (const msg of recentHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Add current question
    messages.push({ role: "user", content: question });

    // Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages,
    });

    // Convert OpenAI stream to ReadableStream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
