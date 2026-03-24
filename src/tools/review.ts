import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Memo, OnThisDayGroup, ReviewStats } from "../types.js";

export const registerReviewTools = (server: McpServer, client: MemosClient) => {
  server.tool(
    "list_review_memos",
    "Get memos due for spaced-repetition review",
    {
      force: z.boolean().default(false).describe("Force refresh the daily review cache"),
    },
    async ({ force }) => {
      const params: Record<string, string> = {};
      if (force) params.force = "true";
      const result = await client.get<{ memos: Memo[]; totalCount: number; completed: boolean }>(
        "/api/v1/review/memos",
        params
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_random_memo",
    "Get a random memo for surprise review",
    {},
    async () => {
      const memo = await client.get<Memo>("/api/v1/review/random");
      return { content: [{ type: "text" as const, text: JSON.stringify(memo, null, 2) }] };
    }
  );

  server.tool(
    "list_on_this_day_memos",
    "Get memos created on this day in previous years",
    {
      month: z.number().int().min(1).max(12).optional().describe("Month (1-12), defaults to current"),
      day: z.number().int().min(1).max(31).optional().describe("Day (1-31), defaults to current"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
      pageSize: z.number().int().min(1).max(100).default(20).describe("Page size"),
    },
    async ({ month, day, offset, pageSize }) => {
      const params: Record<string, string> = {
        offset: String(offset),
        pageSize: String(pageSize),
      };
      if (month !== undefined) params.month = String(month);
      if (day !== undefined) params.day = String(day);
      const result = await client.get<{ groups: OnThisDayGroup[]; totalCount: number }>(
        "/api/v1/review/on-this-day",
        params
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_time_travel_memos",
    "Get memos from a random or specified time period",
    {
      pageSize: z.number().int().min(1).max(100).default(20).describe("Page size"),
      periodStart: z.string().optional().describe("ISO 8601 start date, e.g. 2024-01-01T00:00:00Z"),
      periodEnd: z.string().optional().describe("ISO 8601 end date"),
      offset: z.number().int().min(0).default(0).describe("Pagination offset"),
    },
    async ({ pageSize, periodStart, periodEnd, offset }) => {
      const params: Record<string, string> = {
        pageSize: String(pageSize),
        offset: String(offset),
      };
      if (periodStart) params.periodStart = periodStart;
      if (periodEnd) params.periodEnd = periodEnd;
      const result = await client.get<{
        memos: Memo[];
        periodStart: string;
        periodEnd: string;
        totalCount: number;
      }>("/api/v1/review/time-travel", params);
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "record_review",
    "Record that memos have been reviewed",
    {
      memoIds: z.array(z.number().int()).min(1).describe("IDs of reviewed memos"),
      source: z
        .enum([
          "REVIEW_SOURCE_REVIEW",
          "REVIEW_SOURCE_ON_THIS_DAY",
          "REVIEW_SOURCE_SURPRISE",
          "REVIEW_SOURCE_TIME_TRAVEL",
        ])
        .describe("Review source"),
    },
    async ({ memoIds, source }) => {
      const result = await client.post<{ sessionId: number; recordedCount: number }>(
        "/api/v1/review/record",
        {
          memoNames: memoIds.map((id) => `memos/${id}`),
          source,
        }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_review_stats",
    "Get review statistics",
    {},
    async () => {
      const stats = await client.get<ReviewStats>("/api/v1/review/stats");
      return { content: [{ type: "text" as const, text: JSON.stringify(stats, null, 2) }] };
    }
  );
};
