import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MemosClient } from "../client.js";
import type { Memo } from "../types.js";

export const registerResources = (server: McpServer, client: MemosClient) => {
  server.resource(
    "memo",
    "memo://memos/{uid}",
    { description: "A memo by its UID", mimeType: "text/markdown" },
    async (uri) => {
      const uid = uri.pathname.split("/").pop();
      if (!uid) {
        throw new Error("Invalid memo URI: missing UID");
      }
      const memo = await client.get<Memo>(`/api/v1/memos:by-uid/${uid}`);

      // Format as markdown with YAML frontmatter
      const id = memo.name?.match(/^memos\/(\d+)$/)?.[1];
      const frontmatter = [
        "---",
        id ? `id: ${id}` : null,
        `uid: ${memo.uid}`,
        `visibility: ${memo.visibility}`,
        memo.pinned ? `pinned: true` : null,
        `created: ${memo.createTime}`,
        `updated: ${memo.updateTime}`,
        memo.tags?.length ? `tags: [${memo.tags.join(", ")}]` : null,
        "---",
      ]
        .filter(Boolean)
        .join("\n");

      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/markdown",
            text: `${frontmatter}\n\n${memo.content}`,
          },
        ],
      };
    }
  );
};
