import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Memo } from "../types.js";

export const registerMemoTools = (server: McpServer, client: MemosClient) => {
  server.tool(
    "list_memos",
    "List memos with optional filtering and pagination",
    {
      pageSize: z.number().int().min(1).max(100).default(20).describe("Number of memos per page"),
      pageToken: z.string().optional().describe("Page token for pagination"),
      filter: z.string().optional().describe("CEL filter expression, e.g. \"visibilities == ['PUBLIC']\""),
      state: z.enum(["NORMAL", "ARCHIVED"]).optional().describe("Filter by memo state"),
    },
    async ({ pageSize, pageToken, filter, state }) => {
      const params: Record<string, string> = { pageSize: String(pageSize) };
      if (pageToken) params.pageToken = pageToken;
      if (state) {
        const stateFilter = `row_status == "${state === "ARCHIVED" ? "ARCHIVED" : "ACTIVE"}"`;
        params.filter = filter ? `${filter} && ${stateFilter}` : stateFilter;
      } else if (filter) {
        params.filter = filter;
      }
      const result = await client.get<{ memos: Memo[]; nextPageToken?: string }>("/api/v1/memos", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_memo",
    "Get a single memo by ID",
    {
      id: z.number().int().describe("Memo ID"),
    },
    async ({ id }) => {
      const memo = await client.get<Memo>(`/api/v1/memos/${id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(memo, null, 2) }] };
    }
  );

  server.tool(
    "search_memos",
    "Search memos by keyword in content",
    {
      query: z.string().min(1).describe("Search keyword"),
      pageSize: z.number().int().min(1).max(100).default(20).describe("Number of results"),
    },
    async ({ query, pageSize }) => {
      const filter = `content.contains("${query.replace(/"/g, '\\"')}")`;
      const result = await client.get<{ memos: Memo[]; nextPageToken?: string }>("/api/v1/memos", {
        pageSize: String(pageSize),
        filter,
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "create_memo",
    "Create a new memo",
    {
      content: z.string().min(1).describe("Memo content in markdown"),
      visibility: z.enum(["PRIVATE", "PROTECTED", "PUBLIC"]).default("PRIVATE").describe("Memo visibility"),
    },
    async ({ content, visibility }) => {
      const memo = await client.post<Memo>("/api/v1/memos", { content, visibility });
      return { content: [{ type: "text" as const, text: JSON.stringify(memo, null, 2) }] };
    }
  );

  server.tool(
    "update_memo",
    "Update an existing memo",
    {
      id: z.number().int().describe("Memo ID"),
      content: z.string().optional().describe("New content"),
      visibility: z.enum(["PRIVATE", "PROTECTED", "PUBLIC"]).optional().describe("New visibility"),
      pinned: z.boolean().optional().describe("Pin or unpin the memo"),
      state: z.enum(["NORMAL", "ARCHIVED"]).optional().describe("Archive or restore the memo"),
    },
    async ({ id, content, visibility, pinned, state }) => {
      const body: Record<string, unknown> = {};
      const updateMaskPaths: string[] = [];

      if (content !== undefined) {
        body.content = content;
        updateMaskPaths.push("content");
      }
      if (visibility !== undefined) {
        body.visibility = visibility;
        updateMaskPaths.push("visibility");
      }
      if (pinned !== undefined) {
        body.pinned = pinned;
        updateMaskPaths.push("pinned");
      }
      if (state !== undefined) {
        body.rowStatus = state === "ARCHIVED" ? "ARCHIVED" : "ACTIVE";
        updateMaskPaths.push("row_status");
      }

      const memo = await client.patch<Memo>(`/api/v1/memos/${id}`, body, {
        updateMask: updateMaskPaths.join(","),
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(memo, null, 2) }] };
    }
  );

  server.tool(
    "delete_memo",
    "Permanently delete a memo",
    {
      id: z.number().int().describe("Memo ID to delete"),
    },
    async ({ id }) => {
      await client.delete(`/api/v1/memos/${id}`);
      return { content: [{ type: "text" as const, text: `Memo ${id} deleted.` }] };
    }
  );
};
