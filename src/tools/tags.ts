import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Tag } from "../types.js";

export const registerTagTools = (server: McpServer, client: MemosClient) => {
  server.tool(
    "list_pinned_tags",
    "List all pinned tags",
    {},
    async () => {
      const result = await client.get<{ tags: Tag[] }>("/api/v1/tags:pinned");
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "list_tags_with_emoji",
    "List all tags with their associated emojis",
    {},
    async () => {
      const result = await client.get<{ tags: Tag[] }>("/api/v1/tags:emoji");
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "update_tag",
    "Update a tag's emoji or pinned status",
    {
      tagName: z.string().min(1).describe("Tag name (without #)"),
      emoji: z.string().optional().describe("Emoji to associate with the tag"),
      pinned: z.boolean().optional().describe("Pin or unpin the tag"),
    },
    async ({ tagName, emoji, pinned }) => {
      const body: Record<string, unknown> = {};
      const updateMaskPaths: string[] = [];

      if (emoji !== undefined) {
        body.emoji = emoji;
        updateMaskPaths.push("emoji");
      }
      if (pinned !== undefined) {
        body.pinned = pinned;
        updateMaskPaths.push("pinned");
      }

      const tag = await client.patch<Tag>(`/api/v1/tags/${tagName}`, body, {
        updateMask: updateMaskPaths.join(","),
      });
      return { content: [{ type: "text" as const, text: JSON.stringify(tag, null, 2) }] };
    }
  );
};
