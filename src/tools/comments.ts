import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Memo } from "../types.js";

export const registerCommentTools = (server: McpServer, client: MemosClient) => {
  server.tool(
    "list_memo_comments",
    "List comments on a memo",
    {
      id: z.number().int().describe("Memo ID"),
    },
    async ({ id }) => {
      const result = await client.get<{ memos: Memo[] }>(`/api/v1/memos/${id}/comments`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_memo_comment",
    "Add a comment to a memo",
    {
      id: z.number().int().describe("Memo ID to comment on"),
      content: z.string().min(1).describe("Comment content"),
      visibility: z.enum(["PRIVATE", "PROTECTED", "PUBLIC"]).default("PRIVATE").describe("Comment visibility"),
    },
    async ({ id, content, visibility }) => {
      const comment = await client.post<Memo>(`/api/v1/memos/${id}/comments`, {
        content,
        visibility,
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(comment, null, 2) }] };
    }
  );
};
