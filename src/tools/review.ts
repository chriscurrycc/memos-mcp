import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Memo } from "../types.js";
import { summarizeMemo } from "./utils.js";

interface OnThisDayGroup {
  year: number;
  memos: Memo[];
}

export const registerReviewTools = (server: McpServer, client: MemosClient) => {
  // 1. get_review_memos
  server.tool(
    "get_review_memos",
    "Get today's batch of memos for spaced-repetition review (回顾). Returns a daily batch selected by the review algorithm.",
    {
      refresh: z
        .boolean()
        .optional()
        .describe("Load a new batch even if today's review is already completed"),
    },
    { readOnlyHint: true, openWorldHint: false },
    async ({ refresh }) => {
      const params: Record<string, string> = {};
      if (refresh) params.force = "true";
      const result = await client.get<{
        memos: Memo[];
        totalCount: number;
        completed: boolean;
      }>("/api/v1/review/memos", params);

      const summaries = (result.memos || []).map((m) =>
        summarizeMemo(m as unknown as Record<string, unknown>)
      );
      const output: Record<string, unknown> = {
        memos: summaries,
        totalEligible: result.totalCount,
        completed: result.completed,
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
    }
  );

  // 2. complete_review
  server.tool(
    "complete_review",
    "Mark the current review batch as completed. Call this after the user has finished reviewing all memos from get_review_memos.",
    {
      memoIds: z
        .array(z.number().int())
        .min(1)
        .describe("IDs of the reviewed memos"),
    },
    { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async ({ memoIds }) => {
      const result = await client.post<{ sessionId: number; recordedCount: number }>(
        "/api/v1/review/record",
        {
          memoNames: memoIds.map((id) => `memos/${id}`),
          source: "REVIEW_SOURCE_REVIEW",
        }
      );
      return {
        content: [
          {
            type: "text" as const,
            text: `Review completed: ${result.recordedCount} memo(s) recorded.`,
          },
        ],
      };
    }
  );

  // 3. get_on_this_day_memos
  server.tool(
    "get_on_this_day_memos",
    "Get memos created on this day in previous years, grouped by year. Great for revisiting past thoughts and memories.",
    {
      month: z
        .number()
        .int()
        .min(1)
        .max(12)
        .optional()
        .describe("Month (1-12), defaults to current month"),
      day: z
        .number()
        .int()
        .min(1)
        .max(31)
        .optional()
        .describe("Day (1-31), defaults to current day"),
    },
    { readOnlyHint: true, openWorldHint: false },
    async ({ month, day }) => {
      const params: Record<string, string> = {
        pageSize: "100",
      };
      if (month !== undefined) params.month = String(month);
      if (day !== undefined) params.day = String(day);
      const result = await client.get<{
        groups: OnThisDayGroup[];
        totalCount: number;
      }>("/api/v1/review/on-this-day", params);

      const groups = (result.groups || []).map((g) => ({
        year: g.year,
        memos: (g.memos || []).map((m) =>
          summarizeMemo(m as unknown as Record<string, unknown>)
        ),
      }));

      if (groups.length === 0) {
        return { content: [{ type: "text" as const, text: "No memos found on this day in previous years." }] };
      }

      const output = { groups, totalCount: result.totalCount };
      return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] };
    }
  );

  // 4. update_review_setting
  server.tool(
    "update_review_setting",
    "Update review preferences: how many memos per batch, and which tags to include or exclude.",
    {
      sessionSize: z
        .number()
        .int()
        .min(1)
        .max(50)
        .optional()
        .describe("Number of memos per review batch (default 10)"),
      includeTags: z
        .array(z.string())
        .optional()
        .describe("Only review memos with these tags. Empty array or omit for all tags"),
      excludeTags: z
        .array(z.string())
        .optional()
        .describe("Skip memos with these tags"),
    },
    { destructiveHint: false, idempotentHint: true, openWorldHint: false },
    async ({ sessionSize, includeTags, excludeTags }) => {
      const currentUser = await client.getCurrentUser();
      const userId = currentUser.match(/^users\/(\d+)$/)?.[1];
      if (!userId) throw new Error(`Unexpected user format: ${currentUser}`);

      // Get current setting first
      const current = await client.get<{
        reviewSetting?: { sessionSize?: number; includeTags?: string[]; excludeTags?: string[] };
      }>(`/api/v1/users/${userId}/setting`);

      const reviewSetting = {
        sessionSize: sessionSize ?? current.reviewSetting?.sessionSize ?? 10,
        includeTags: includeTags ?? current.reviewSetting?.includeTags ?? [],
        excludeTags: excludeTags ?? current.reviewSetting?.excludeTags ?? [],
      };

      await client.patch(`/api/v1/users/${userId}/setting`, { reviewSetting }, {
        updateMask: "review_setting",
      });

      return {
        content: [
          {
            type: "text" as const,
            text: `Review setting updated: ${JSON.stringify(reviewSetting)}`,
          },
        ],
      };
    }
  );
};
