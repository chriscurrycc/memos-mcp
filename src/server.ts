import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MemosClient } from "./client.js";
import { registerMemoTools } from "./tools/memos.js";
import { registerTagTools } from "./tools/tags.js";
import { registerResourceTools } from "./tools/resources.js";
import { registerRelationTools } from "./tools/relations.js";
import { registerReviewTools } from "./tools/review.js";
import { registerPrompts } from "./prompts/index.js";
import { registerResources } from "./resources/index.js";

const VALID_VISIBILITIES = ["PRIVATE", "PROTECTED", "PUBLIC"] as const;
type Visibility = (typeof VALID_VISIBILITIES)[number];

export const createServer = () => {
  const memosUrl = process.env.MEMOS_URL;
  const memosToken = process.env.MEMOS_TOKEN;

  if (!memosUrl) {
    console.error("Error: MEMOS_URL environment variable is required");
    process.exit(1);
  }
  if (!memosToken) {
    console.error("Error: MEMOS_TOKEN environment variable is required");
    process.exit(1);
  }

  const rawVisibility = process.env.MEMOS_DEFAULT_VISIBILITY?.toUpperCase();
  const defaultVisibility: Visibility =
    rawVisibility && VALID_VISIBILITIES.includes(rawVisibility as Visibility)
      ? (rawVisibility as Visibility)
      : "PRIVATE";

  const client = new MemosClient(memosUrl, memosToken);

  const server = new McpServer({
    name: "memos-mcp",
    version: "1.0.0",
  });

  registerMemoTools(server, client, { defaultVisibility });
  registerTagTools(server, client);
  registerResourceTools(server, client);
  registerRelationTools(server, client);
  registerReviewTools(server, client);
  registerPrompts(server);

  // Register MCP resources
  registerResources(server, client);

  return server;
};
