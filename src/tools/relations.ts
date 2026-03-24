import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { MemoRelation } from "../types.js";

export const registerRelationTools = (server: McpServer, client: MemosClient) => {
  server.tool(
    "list_memo_relations",
    "List relations of a memo (references and comments)",
    {
      id: z.number().int().describe("Memo ID"),
    },
    async ({ id }) => {
      const result = await client.get<{ relations: MemoRelation[] }>(`/api/v1/memos/${id}/relations`);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "set_memo_relations",
    "Set relations for a memo (replaces all existing relations)",
    {
      id: z.number().int().describe("Memo ID"),
      relations: z
        .array(
          z.object({
            relatedMemoId: z.number().int().describe("Related memo ID"),
            type: z.enum(["REFERENCE", "COMMENT"]).describe("Relation type"),
          })
        )
        .describe("List of relations to set"),
    },
    async ({ id, relations }) => {
      const body = {
        relations: relations.map((r) => ({
          memo: `memos/${id}`,
          relatedMemo: `memos/${r.relatedMemoId}`,
          type: r.type,
        })),
      };
      const result = await client.patch<{ relations: MemoRelation[] }>(
        `/api/v1/memos/${id}/relations`,
        body
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "delete_memo_relation",
    "Remove a specific relation from a memo",
    {
      id: z.number().int().describe("Memo ID"),
      relatedMemoId: z.number().int().describe("Related memo ID to unlink"),
      type: z.enum(["REFERENCE", "COMMENT"]).describe("Relation type to remove"),
    },
    async ({ id, relatedMemoId, type }) => {
      // Get current relations, filter out the target, set remaining
      const current = await client.get<{ relations: MemoRelation[] }>(`/api/v1/memos/${id}/relations`);
      const remaining = (current.relations || []).filter(
        (r) =>
          !(
            r.relatedMemo === `memos/${relatedMemoId}` && r.type === type
          )
      );
      const result = await client.patch<{ relations: MemoRelation[] }>(
        `/api/v1/memos/${id}/relations`,
        { relations: remaining }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
};
