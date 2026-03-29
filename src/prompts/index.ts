import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const registerPrompts = (server: McpServer) => {
  server.registerPrompt(
    "capture",
    {
      description: "Quick-save a thought as a memo",
      argsSchema: {
        content: z.string().describe("The thought or note to capture"),
        tags: z.string().optional().describe("Comma-separated tags to add, e.g. 'idea,project'"),
        visibility: z.enum(["PRIVATE", "PROTECTED", "PUBLIC"]).default("PRIVATE").describe("Memo visibility"),
      },
    },
    ({ content, tags, visibility }) => {
      let memoContent = content;
      if (tags) {
        const tagList = tags
          .split(",")
          .map((t) => `#${t.trim()}`)
          .join(" ");
        memoContent = `${memoContent}\n\n${tagList}`;
      }
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create a memo with the following content using the create_memo tool. Visibility: ${visibility}.\n\nContent:\n${memoContent}`,
            },
          },
        ],
      };
    }
  );

  server.registerPrompt(
    "review",
    {
      description: "Start a spaced-repetition review session (间隔回顾)",
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Start a memo review session:
1. Call get_review_memos to get today's review batch
2. If completed=true, let me know today's review is done and ask if I want to load a new batch (refresh=true)
3. Otherwise, use get_memo to fetch full content for each memo and present them one by one
4. After presenting all memos, call complete_review with the memo IDs to mark the batch as completed
5. Congratulate me on completing the review`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "on_this_day",
    {
      description: "See memos from this day in previous years (历史上的今天)",
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Show me my "On This Day" memories:
1. Call get_on_this_day_memos to get memos from this day in previous years
2. Present them grouped by year, starting from the most recent
3. For each memo, use get_memo to show the full content
4. Add a brief reflection on how my thoughts or interests have evolved over the years`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "digest",
    {
      description: "Summarize memo activity for a time period",
      argsSchema: {
        period: z.enum(["today", "week", "month"]).default("week").describe("Time period to summarize"),
      },
    },
    ({ period }) => {
      const periodMap = {
        today: { days: 1, label: "today" },
        week: { days: 7, label: "the past week" },
        month: { days: 30, label: "the past month" },
      };
      const { days, label } = periodMap[period];
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create a digest of my memo activity for ${label}:
1. Call list_memos with startDate set to ${days} days ago, pageSize=100 to get recent memos
2. Call list_tags to see tag usage patterns
3. Summarize:
   - Total number of memos created/updated in this period
   - Key themes and topics based on tags and content
   - Any pinned memos that might need attention
   - Any memos with incomplete tasks (call list_memos with hasIncompleteTasks=true)
   - Trends or patterns you notice
4. Present as a concise briefing`,
            },
          },
        ],
      };
    }
  );

  server.registerPrompt(
    "tag_overview",
    {
      description: "Review your tag system and organization",
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Give me an overview of my tag system:
1. Call list_tags to get all top-level tags with counts
2. For tags with children (hasChildren=true), call list_tags with parent param to show the hierarchy
3. Call list_tags with pinnedOnly=true to highlight my pinned tags
4. Analyze and present:
   - Tag hierarchy structure
   - Most used vs rarely used tags
   - Pinned tags and their usage
   - Suggestions for cleanup (similar tags that could be merged, unused tags, etc.)`,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "relation_graph",
    {
      description: "Explore the relation graph starting from a memo (关系图谱)",
      argsSchema: {
        memo: z.string().describe("Memo ID or UID to start from"),
      },
    },
    ({ memo }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Explore the relation graph starting from memo ${memo}:
1. Call get_memo to show the starting memo's content
2. Call list_memo_relations with id="${memo}" and depth=5 to get the full relation graph
3. For each connected memo, call get_memo to understand its content
4. Present:
   - A text-based visualization of the graph structure (which memos reference which)
   - Brief summary of each connected memo
   - The themes and topics that connect these memos
   - Any interesting patterns or clusters in the graph`,
          },
        },
      ],
    })
  );
};
