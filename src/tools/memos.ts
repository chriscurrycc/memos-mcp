import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Memo } from "../types.js";
import { summarizeMemo } from "./utils.js";

type Visibility = "PRIVATE" | "PROTECTED" | "PUBLIC";

interface FilterOptions {
  creator: string;
  query?: string;
  tags?: string[];
  visibility?: Visibility[];
  state?: "NORMAL" | "ARCHIVED";
  pinned?: boolean;
  startDate?: string;
  endDate?: string;
  hasLink?: boolean;
  hasTaskList?: boolean;
  hasCode?: boolean;
  hasIncompleteTasks?: boolean;
  random?: boolean;
}

function parseToUnixTimestamp(isoString: string, paramName: string): number {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) {
    throw new Error(
      `Invalid date format for ${paramName}. Use ISO 8601 format (e.g., "2025-01-01" or "2025-01-01T00:00:00Z").`
    );
  }
  return Math.floor(date.getTime() / 1000);
}

function buildCelFilter(opts: FilterOptions): string {
  const parts: string[] = [`creator == "${opts.creator}"`];

  if (opts.query) {
    const escaped = opts.query.replace(/"/g, '\\"');
    parts.push(`content_search == ["${escaped}"]`);
  }
  if (opts.tags?.length) {
    const tagList = opts.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ");
    parts.push(`tag_search == [${tagList}]`);
  }
  if (opts.visibility?.length) {
    const visList = opts.visibility.map((v) => `"${v}"`).join(", ");
    parts.push(`visibilities == [${visList}]`);
  }
  if (opts.state) {
    parts.push(`row_status == "${opts.state === "ARCHIVED" ? "ARCHIVED" : "ACTIVE"}"`);
  }
  if (opts.pinned !== undefined) {
    parts.push(`pinned == ${opts.pinned}`);
  }
  if (opts.startDate) {
    parts.push(`display_time_after == ${parseToUnixTimestamp(opts.startDate, "startDate")}`);
  }
  if (opts.endDate) {
    parts.push(`display_time_before == ${parseToUnixTimestamp(opts.endDate, "endDate")}`);
  }
  if (opts.hasLink) parts.push(`has_link == true`);
  if (opts.hasTaskList) parts.push(`has_task_list == true`);
  if (opts.hasCode) parts.push(`has_code == true`);
  if (opts.hasIncompleteTasks) parts.push(`has_incomplete_tasks == true`);
  if (opts.random) parts.push(`random == true`);

  return parts.join(" && ");
}

async function resolveToNumericId(client: MemosClient, id: string): Promise<number> {
  if (/^\d+$/.test(id)) {
    return parseInt(id, 10);
  }
  const memo = await client.get<Memo>(`/api/v1/memos:by-uid/${id}`);
  const match = memo.name.match(/^memos\/(\d+)$/);
  if (!match) throw new Error(`Unexpected memo name format: ${memo.name}`);
  return parseInt(match[1], 10);
}

function cleanMemo(memo: Record<string, unknown>) {
  const { name, nodes, snippet, creator, ...rest } = memo;
  const id = (name as string)?.match(/^memos\/(\d+)$/)?.[1];
  if (id) rest.id = Number(id);
  for (const key of ["resources", "relations", "reactions"]) {
    if (Array.isArray(rest[key]) && (rest[key] as unknown[]).length === 0) {
      delete rest[key];
    }
  }
  return rest;
}

interface MemoToolsOptions {
  defaultVisibility: Visibility;
}

export const registerMemoTools = (
  server: McpServer,
  client: MemosClient,
  options: MemoToolsOptions
) => {
  const visibilityEnum = z.enum(["PRIVATE", "PROTECTED", "PUBLIC"]);

  server.registerTool(
    "list_memos",
    {
      description: "Search and list memos. All filters are optional and combined with AND logic.",
      inputSchema: {
        query: z.string().optional().describe("Keyword search in memo content"),
        tags: z.array(z.string()).optional().describe("Filter by tags, e.g. [\"project\", \"todo\"]"),
        visibility: z.array(visibilityEnum).optional().describe("Filter by visibility levels"),
        state: z.enum(["NORMAL", "ARCHIVED"]).optional().describe("Filter by memo state"),
        pinned: z.boolean().optional().describe("Filter by pinned status"),
        startDate: z.string().optional().describe("Return memos after this date (ISO 8601, e.g. \"2025-01-01\")"),
        endDate: z.string().optional().describe("Return memos before this date (ISO 8601, e.g. \"2025-03-01\")"),
        hasLink: z.boolean().optional().describe("Filter to memos containing links"),
        hasTaskList: z.boolean().optional().describe("Filter to memos containing task lists"),
        hasCode: z.boolean().optional().describe("Filter to memos containing code blocks"),
        hasIncompleteTasks: z.boolean().optional().describe("Filter to memos with incomplete tasks"),
        random: z.boolean().optional().describe("Return results in random order"),
        pageSize: z.number().int().min(1).max(100).default(20).describe("Number of memos per page"),
        pageToken: z.string().optional().describe("Token for fetching the next page"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async (args) => {
      const currentUser = await client.getCurrentUser();
      const filter = buildCelFilter({ creator: currentUser, ...args });
      const params: Record<string, string> = {
        pageSize: String(args.pageSize),
        filter,
      };
      if (args.pageToken) params.pageToken = args.pageToken;
      const result = await client.get<{ memos: Memo[]; nextPageToken?: string }>(
        "/api/v1/memos",
        params
      );
      const summaries = (result.memos || []).map((m) =>
        summarizeMemo(m as unknown as Record<string, unknown>)
      );
      const output: Record<string, unknown> = { memos: summaries };
      if (result.nextPageToken) output.nextPageToken = result.nextPageToken;
      return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
    }
  );

  server.registerTool(
    "get_memo",
    {
      description: "Get a single memo by its numeric ID or UID string (the ID from the memo URL).",
      inputSchema: {
        id: z.string().min(1).describe("Memo identifier. Numeric ID (e.g. \"42\") or UID string (e.g. \"AjF4AQJayxvDj2mrWzFWuP\")"),
      },
      annotations: { readOnlyHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const path = /^\d+$/.test(id)
        ? `/api/v1/memos/${id}`
        : `/api/v1/memos:by-uid/${id}`;
      const memo = await client.get<Memo>(path);
      const cleaned = cleanMemo(memo as unknown as Record<string, unknown>);
      return { content: [{ type: "text" as const, text: JSON.stringify(cleaned, null, 2) }] };
    }
  );

  server.registerTool(
    "create_memo",
    {
      description: "Create a new memo with markdown content.",
      inputSchema: {
        content: z.string().min(1).describe("Memo content in markdown. Tags can be included with #tagname syntax"),
        visibility: visibilityEnum.optional().describe("Memo visibility. Omit to use the configured default"),
      },
      annotations: { destructiveHint: false, openWorldHint: false },
    },
    async ({ content, visibility }) => {
      const memo = await client.post<Memo>("/api/v1/memos", {
        content,
        visibility: visibility ?? options.defaultVisibility,
      });
      const id = memo.name?.match(/^memos\/(\d+)$/)?.[1];
      const url = `${client.baseUrl}/m/${memo.uid}`;
      const result = { id: id ? Number(id) : undefined, uid: memo.uid, visibility: memo.visibility, url };
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    }
  );

  server.registerTool(
    "update_memo",
    {
      description: "Update an existing memo. Only the fields you provide will be modified.",
      inputSchema: {
        id: z.string().min(1).describe("Memo identifier. Numeric ID or UID string"),
        content: z.string().optional().describe("New memo content in markdown"),
        visibility: visibilityEnum.optional().describe("New visibility level"),
        pinned: z.boolean().optional().describe("Pin or unpin the memo"),
        state: z.enum(["NORMAL", "ARCHIVED"]).optional().describe("Set to ARCHIVED to archive, NORMAL to restore"),
        preserveUpdateTime: z.boolean().optional().describe("When true, the memo's update time will not change. Use for formatting or style-only edits"),
      },
      annotations: { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ id, content, visibility, pinned, state, preserveUpdateTime }) => {
      const numericId = await resolveToNumericId(client, id);

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

      if (updateMaskPaths.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "No fields to update. Provide at least one of: content, visibility, pinned, state.",
            },
          ],
        };
      }

      const params: Record<string, string> = {
        updateMask: updateMaskPaths.join(","),
      };
      if (preserveUpdateTime) params.preserveUpdateTime = "true";
      const memo = await client.patch<Memo>(`/api/v1/memos/${numericId}`, body, params);
      const url = `${client.baseUrl}/m/${memo.uid}`;
      return { content: [{ type: "text" as const, text: `Memo updated: ${url}` }] };
    }
  );

  server.registerTool(
    "delete_memo",
    {
      description: "Permanently delete a memo. This action cannot be undone.",
      inputSchema: {
        id: z.string().min(1).describe("Memo identifier. Numeric ID or UID string"),
      },
      annotations: { destructiveHint: true, idempotentHint: true, openWorldHint: false },
    },
    async ({ id }) => {
      const numericId = await resolveToNumericId(client, id);
      await client.delete(`/api/v1/memos/${numericId}`);
      return { content: [{ type: "text" as const, text: `Memo ${id} deleted.` }] };
    }
  );
};
