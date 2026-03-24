import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { MemosClient } from "../client.js";
import type { Resource } from "../types.js";

export const registerResourceTools = (server: McpServer, client: MemosClient) => {
  server.tool(
    "list_resources",
    "List all resources (attachments)",
    {},
    async () => {
      const result = await client.get<{ resources: Resource[] }>("/api/v1/resources");
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "get_resource",
    "Get a resource by ID",
    {
      id: z.number().int().describe("Resource ID"),
    },
    async ({ id }) => {
      const resource = await client.get<Resource>(`/api/v1/resources/${id}`);
      return { content: [{ type: "text" as const, text: JSON.stringify(resource, null, 2) }] };
    }
  );

  server.tool(
    "delete_resource",
    "Delete a resource",
    {
      id: z.number().int().describe("Resource ID"),
    },
    async ({ id }) => {
      await client.delete(`/api/v1/resources/${id}`);
      return { content: [{ type: "text" as const, text: `Resource ${id} deleted.` }] };
    }
  );

  server.tool(
    "link_resource_to_memo",
    "Link resources to a memo",
    {
      memoId: z.number().int().describe("Memo ID"),
      resourceIds: z.array(z.number().int()).min(1).describe("Resource IDs to link"),
    },
    async ({ memoId, resourceIds }) => {
      const resources = resourceIds.map((id) => ({ name: `resources/${id}` }));
      const result = await client.patch<{ resources: Resource[] }>(
        `/api/v1/memos/${memoId}/resources`,
        { resources }
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
    }
  );
};
