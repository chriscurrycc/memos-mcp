import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export interface PromptDefinition {
  description: string;
  text: string;
}

/** Returns the static text for each prompt, keyed by prompt name. */
export const getPromptDefinitions = (): Record<string, PromptDefinition> => ({
  capture: {
    description: "Quick-save a thought as a memo",
    text: "Create a memo with the provided content using the create_memo tool.",
  },
  review: {
    description: "Start a spaced-repetition review session (间隔回顾)",
    text: `Start a memo review session:
1. Call get_review_memos to get today's review batch
2. If completed=true, let me know today's review is done and ask if I want to load a new batch (refresh=true)
3. Otherwise, present memos ONE AT A TIME in an interactive flow:
   a. Use get_memo to fetch the full content of the FIRST memo and present it
   b. Present the memo with ALL of its content (do not omit anything). Include:
      - Created time and updated time at the top
      - The full memo content with proper formatting (keep inline tags as-is in the content)
      - If there are tags NOT already visible at the end of the content, display them highlighted at the bottom. If tags are already at the end of the content, no need to repeat them.
      You may reformat for readability but must preserve the exact markdown formatting (bold, italic, links, etc.) from the original content. Do not drop any content or tags.
   c. Wait for the user to confirm before moving to the next memo (e.g. user says "next", "ok", "continue", etc.)
   d. Repeat for each memo until all memos have been reviewed
4. After the LAST memo is presented and the user confirms, ask the user if they want to mark this review batch as completed
5. Only call complete_review with the memo IDs after the user explicitly confirms completion
6. Congratulate me on completing the review`,
  },
  on_this_day: {
    description: "See memos from this day in previous years (历史上的今天)",
    text: `Show me my "On This Day" memories:
1. Call get_on_this_day_memos to get memos from this day in previous years
2. Present them grouped by year, starting from the most recent
3. For each memo, use get_memo to show the full content
4. Add a brief reflection on how my thoughts or interests have evolved over the years`,
  },
  digest: {
    description: "Summarize memo activity for a time period",
    text: "Create a digest of my memo activity for the specified period.",
  },
  tag_overview: {
    description: "Review your tag system and organization",
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
  relation_graph: {
    description: "Explore the relation graph starting from a memo (关系图谱)",
    text: `Explore the relation graph starting from the specified memo:
1. Call get_memo to show the starting memo's content
2. Call list_memo_relations with the memo id and depth=5 to get the full relation graph
3. For each connected memo, call get_memo to understand its content
4. Present:
   - A text-based visualization of the graph structure (which memos reference which)
   - Brief summary of each connected memo
   - The themes and topics that connect these memos
   - Any interesting patterns or clusters in the graph`,
  },
});

export const registerPrompts = (server: McpServer) => {
  const defs = getPromptDefinitions();

  server.registerPrompt(
    "capture",
    {
      description: defs.capture.description,
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
      description: defs.review.description,
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: defs.review.text,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "on_this_day",
    {
      description: defs.on_this_day.description,
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: defs.on_this_day.text,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "digest",
    {
      description: defs.digest.description,
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
      description: defs.tag_overview.description,
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: defs.tag_overview.text,
          },
        },
      ],
    })
  );

  server.registerPrompt(
    "relation_graph",
    {
      description: defs.relation_graph.description,
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
