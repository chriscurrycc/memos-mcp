import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Resource } from "../types.js";

function summarizeResource(res: Record<string, unknown>) {
  const name = res.name as string;
  const id = name?.match(/^resources\/(\d+)$/)?.[1];
  const summary: Record<string, unknown> = {
    id: id ? Number(id) : undefined,
    uid: res.uid,
    filename: res.filename,
    type: res.type,
    size: res.size,
  };
  if (res.externalLink) summary.externalLink = res.externalLink;
  if (res.memo) summary.memo = res.memo;
  return summary;
}

export const registerResourceTools = (server: McpServer, client: MemosClient) => {
  server.tool(
    "list_resources",
    "List all resources (attachments) owned by the current user.",
    {},
    { readOnlyHint: true, openWorldHint: false },
    async () => {
      const result = await client.get<{ resources: Resource[] }>("/api/v1/resources");
      const summaries = (result.resources || []).map((r) =>
        summarizeResource(r as unknown as Record<string, unknown>)
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(summaries, null, 2) }] };
    }
  );

  server.tool(
    "upload_resource",
    "Upload a file as a resource. The file content must be base64 encoded. Optionally link it to a memo.",
    {
      filename: z.string().min(1).describe("File name with extension, e.g. \"photo.jpg\""),
      contentBase64: z.string().min(1).describe("File content as a base64 encoded string"),
      type: z.string().optional().describe("MIME type, e.g. \"image/jpeg\". Auto-detected from extension if omitted"),
      memoId: z
        .number()
        .int()
        .optional()
        .describe("Memo ID to link this resource to"),
    },
    { destructiveHint: false, openWorldHint: false },
    async ({ filename, contentBase64, type, memoId }) => {
      const mimeType = type ?? guessMimeType(filename);
      const body: Record<string, unknown> = {
        filename,
        content: contentBase64,
        type: mimeType,
      };
      if (memoId !== undefined) {
        body.memo = `memos/${memoId}`;
      }
      const resource = await client.post<Resource>("/api/v1/resources", body);
      const id = resource.name?.match(/^resources\/(\d+)$/)?.[1];
      return {
        content: [
          {
            type: "text" as const,
            text: `Resource uploaded: id=${id}, filename="${resource.filename}"`,
          },
        ],
      };
    }
  );

  server.tool(
    "delete_resource",
    "Delete a resource permanently.",
    {
      id: z.number().int().describe("Resource ID"),
    },
    { destructiveHint: true, idempotentHint: true, openWorldHint: false },
    async ({ id }) => {
      await client.delete(`/api/v1/resources/${id}`);
      return { content: [{ type: "text" as const, text: `Resource ${id} deleted.` }] };
    }
  );
};

const MIME_MAP: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  webm: "video/webm",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  csv: "text/csv",
  zip: "application/zip",
};

function guessMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MIME_MAP[ext] ?? "application/octet-stream";
}
