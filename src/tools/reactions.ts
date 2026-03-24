import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Reaction } from "../types.js";

export const registerReactionTools = (server: McpServer, client: MemosClient) => {
  server.tool(
    "list_reactions",
    "List reactions on a memo",
    {
      id: z.number().int().describe("Memo ID"),
    },
    async ({ id }) => {
      const result = await client.get<{ reactions: Reaction[] }>(`/api/v1/memos/${id}/reactions`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "upsert_reaction",
    "Add a reaction emoji to a memo (idempotent)",
    {
      id: z.number().int().describe("Memo ID"),
      reactionType: z.string().min(1).describe("Reaction emoji, e.g. 👍, ❤️, 🎉"),
    },
    async ({ id, reactionType }) => {
      const reaction = await client.post<Reaction>(`/api/v1/memos/${id}/reactions`, {
        reactionType,
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(reaction, null, 2) }] };
    }
  );

  server.tool(
    "delete_reaction",
    "Remove a reaction by ID",
    {
      reactionId: z.number().int().describe("Reaction ID"),
    },
    async ({ reactionId }) => {
      await client.delete(`/api/v1/reactions/${reactionId}`);
      return { content: [{ type: "text" as const, text: `Reaction ${reactionId} deleted.` }] };
    }
  );
};
