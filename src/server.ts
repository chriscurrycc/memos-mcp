import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MemosClient } from "./client.js";
import { registerMemoTools } from "./tools/memos.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerTagTools } from "./tools/tags.js";
import { registerResourceTools } from "./tools/resources.js";
import { registerRelationTools } from "./tools/relations.js";
import { registerReactionTools } from "./tools/reactions.js";
import { registerReviewTools } from "./tools/review.js";
import { registerPrompts } from "./prompts/index.js";
import { registerResources } from "./resources/index.js";

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

  const client = new MemosClient(memosUrl, memosToken);

  const server = new McpServer({
    name: "memos-mcp",
    version: "0.1.1",
  });

  // Register all tools
  registerMemoTools(server, client);
  registerCommentTools(server, client);
  registerTagTools(server, client);
  registerResourceTools(server, client);
  registerRelationTools(server, client);
  registerReactionTools(server, client);
  registerReviewTools(server, client);

  // Register prompts
  registerPrompts(server);

  // Register resources
  registerResources(server, client);

  return server;
};
