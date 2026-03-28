import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Memo, Tag } from "../types.js";

function collectTags(
  memos: Memo[],
  parent?: string,
  recursive?: boolean
): Map<string, number> {
  const tagCounts = new Map<string, number>();

  for (const memo of memos) {
    for (const tag of memo.tags ?? []) {
      if (parent) {
        const prefix = parent + "/";
        if (!tag.startsWith(prefix)) continue;
        if (recursive) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        } else {
          const child = prefix + tag.slice(prefix.length).split("/")[0];
          tagCounts.set(child, (tagCounts.get(child) || 0) + 1);
        }
      } else if (recursive) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      } else {
        const topLevel = tag.split("/")[0];
        tagCounts.set(topLevel, (tagCounts.get(topLevel) || 0) + 1);
      }
    }
  }

  return tagCounts;
}

function buildAllTagsSet(memos: Memo[]): Set<string> {
  const allTags = new Set<string>();
  for (const memo of memos) {
    for (const tag of memo.tags ?? []) {
      allTags.add(tag);
    }
  }
  return allTags;
}

async function fetchAllMemoMetadata(client: MemosClient): Promise<Memo[]> {
  const currentUser = await client.getCurrentUser();
  const filter = `creator == "${currentUser}"`;
  const result = await client.get<{ memos: Memo[] }>(
    "/api/v1/memos",
    {
      pageSize: "1000000",
      filter,
      view: "MEMO_VIEW_METADATA_ONLY",
    }
  );
  return result.memos || [];
}

export const registerTagTools = (server: McpServer, client: MemosClient) => {
  server.tool(
    "list_tags",
    [
      "List tags with usage counts. Returns {name, count, hasChildren, pinned, emoji} for each tag.",
      "- No args: top-level tags only.",
      "- recursive=true: every tag (flat list, good for recommending tags).",
      "- parent=\"x\": direct children of tag \"x\".",
      "- parent=\"x\" + recursive=true: all descendants under \"x\".",
      "- pinnedOnly=true: only user-pinned tags.",
      "Tags use \"/\" for hierarchy (e.g. \"project/work/backend\").",
    ].join(" "),
    {
      parent: z
        .string()
        .optional()
        .describe(
          "Parent tag to scope the listing (e.g. \"project\" or \"project/work\"). Omit to start from root"
        ),
      recursive: z
        .boolean()
        .optional()
        .describe("When true, return all tags/descendants instead of only direct children"),
      pinnedOnly: z
        .boolean()
        .optional()
        .describe("When true, only return user-pinned tags"),
    },
    async ({ parent, recursive, pinnedOnly }) => {
      const [memos, pinnedResult] = await Promise.all([
        fetchAllMemoMetadata(client),
        client.get<{ tags: Tag[] }>("/api/v1/tags:pinned"),
      ]);

      const tagCounts = collectTags(memos, parent, recursive);
      const allTags = buildAllTagsSet(memos);

      const pinnedMap = new Map<string, Tag>();
      for (const t of pinnedResult.tags ?? []) {
        pinnedMap.set(t.tagName, t);
      }

      const results = Array.from(tagCounts.entries())
        .map(([name, count]) => {
          const pinData = pinnedMap.get(name);
          const entry: Record<string, unknown> = { name, count };
          if ([...allTags].some((t) => t.startsWith(name + "/"))) entry.hasChildren = true;
          if (pinData) {
            entry.pinned = true;
            if (pinData.emoji) entry.emoji = pinData.emoji;
          }
          return entry;
        })
        .filter((t) => !pinnedOnly || t.pinned)
        .sort((a, b) => (b.count as number) - (a.count as number) || (a.name as string).localeCompare(b.name as string));

      if (results.length === 0) {
        const msg = pinnedOnly
          ? "No pinned tags found."
          : parent
            ? `No child tags found under "${parent}".`
            : "No tags found.";
        return { content: [{ type: "text" as const, text: msg }] };
      }

      return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
    }
  );

  server.tool(
    "update_tag",
    "Update a tag's pinned status or emoji. Pinned tags are highlighted in the UI for quick access.",
    {
      tagName: z.string().min(1).describe("Tag name (without #)"),
      emoji: z.string().optional().describe("Emoji to associate with the tag (e.g. \"📅\"). Pass empty string to remove"),
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

      await client.patch<Tag>(`/api/v1/tags/${tagName}`, body, {
        updateMask: updateMaskPaths.join(","),
      });
      const parts: string[] = [];
      if (emoji !== undefined) parts.push(emoji ? `emoji set to ${emoji}` : "emoji removed");
      if (pinned !== undefined) parts.push(pinned ? "pinned" : "unpinned");
      return {
        content: [{ type: "text" as const, text: `Tag "#${tagName}" updated: ${parts.join(", ")}.` }],
      };
    }
  );

  server.tool(
    "rename_tag",
    "Rename a tag across ALL memos. This is a destructive operation that modifies memo content globally — use with caution.",
    {
      oldTag: z.string().min(1).describe("Current tag name (without #)"),
      newTag: z.string().min(1).describe("New tag name (without #)"),
    },
    { destructiveHint: true },
    async ({ oldTag, newTag }) => {
      // parent = "memos/-" means rename across all memos
      await client.patch(`/api/v1/memos/-/tags:rename`, {
        parent: "memos/-",
        oldTag,
        newTag,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Tag "#${oldTag}" has been renamed to "#${newTag}" across all memos.`,
          },
        ],
      };
    }
  );
};
