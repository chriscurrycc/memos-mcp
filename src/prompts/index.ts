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
1. Call list_memos with random=true and pageSize=5 to get random memos for review
2. Present each memo one by one with its content (use get_memo for full details)
3. After presenting all memos, ask if I'd like to see more or stop
4. Optionally suggest related memos based on tags`,
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
1. Call list_memos with pageSize=50 to get recent memos
2. Call list_tags to see my top tags and their usage
3. Summarize:
   - How many memos were created/updated recently
   - Key themes and topics based on tags
   - Any pinned memos that might need attention
   - Any memos with incomplete tasks (use hasIncompleteTasks filter)
4. Present everything in a concise daily briefing format`,
            },
          },
        ],
      };
    }
  );
};
