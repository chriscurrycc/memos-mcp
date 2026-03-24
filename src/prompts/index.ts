import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export const registerPrompts = (server: McpServer) => {
  server.prompt(
    "capture",
    "Quick-save a thought as a memo",
    {
      content: z.string().describe("The thought or note to capture"),
      tags: z.string().optional().describe("Comma-separated tags to add, e.g. 'idea,project'"),
      visibility: z.enum(["PRIVATE", "PROTECTED", "PUBLIC"]).default("PRIVATE").describe("Memo visibility"),
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

  server.prompt(
    "review",
    "Start a guided memo review session",
    {},
    () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Start a memo review session:
1. Call list_review_memos to get memos due for review
2. If the session is already completed, let me know
3. Otherwise, present each memo one by one with its content
4. After presenting all memos, ask if I want to record the review
5. If yes, call record_review with the memo IDs and source REVIEW_SOURCE_REVIEW
6. Finally, show the updated review stats using get_review_stats`,
            },
          },
        ],
      };
    }
  );

  server.prompt(
    "daily_digest",
    "Summarize recent memo activity",
    {},
    () => {
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Create a daily digest of my memos:
1. Call list_memos with pageSize 50 to get recent memos
2. Call list_pinned_tags to see my important tags
3. Summarize:
   - How many memos were created/updated recently
   - Key themes and topics based on tags
   - Any pinned memos that might need attention
   - Any memos with incomplete tasks (if visible in properties)
4. Check list_on_this_day_memos for any "on this day" memories
5. Present everything in a concise daily briefing format`,
            },
          },
        ],
      };
    }
  );
};
