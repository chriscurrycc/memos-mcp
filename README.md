# memos-mcp

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [Memos](https://github.com/chriscurrycc/memos) — a self-hosted note-taking service.

[中文文档](README_zh.md)

Enables AI assistants (Claude Code, Claude Desktop, Cursor, etc.) to read and write your memos through a standardized interface.

## Setup

### Prerequisites

- Node.js >= 18
- A running Memos instance
- A Memos access token (Settings → Access Tokens)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MEMOS_URL` | Yes | Your Memos instance URL |
| `MEMOS_TOKEN` | Yes | Memos access token |
| `MEMOS_DEFAULT_VISIBILITY` | No | Default visibility for new memos (`PRIVATE`, `PROTECTED`, `PUBLIC`). Defaults to `PRIVATE` |

### Claude Code

```bash
claude mcp add --scope user memos -e MEMOS_URL=https://your-memos-instance.com -e MEMOS_TOKEN=your-access-token -- npx -y @chriscurrycc/memos-mcp
```

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "memos": {
      "command": "npx",
      "args": ["-y", "@chriscurrycc/memos-mcp"],
      "env": {
        "MEMOS_URL": "https://your-memos-instance.com",
        "MEMOS_TOKEN": "your-access-token"
      }
    }
  }
}
```

### With 1Password (recommended)

Store your token securely in 1Password — no plaintext secrets on disk.

1. Save the token to 1Password:

```bash
op item create --category=apiCredential --title="memos-api" token=your-access-token "valid from[date]=2026-01-01" "expires[date]=2026-02-01"
```

2. Configure with `op run` to inject the token at runtime:

**Claude Code:**

```bash
claude mcp add --scope user memos -e MEMOS_URL=https://your-memos-instance.com -e MEMOS_TOKEN=op://Personal/memos-api/token -- op run --no-masking -- npx -y @chriscurrycc/memos-mcp
```

**Claude Desktop:**

```json
{
  "mcpServers": {
    "memos": {
      "command": "op",
      "args": ["run", "--no-masking", "--", "npx", "-y", "@chriscurrycc/memos-mcp"],
      "env": {
        "MEMOS_URL": "https://your-memos-instance.com",
        "MEMOS_TOKEN": "op://Personal/memos-api/token"
      }
    }
  }
}
```

## Tools

### Memos

| Tool | Description |
|------|-------------|
| `list_memos` | Search and list memos with structured filters (keyword, tags, date range, visibility, pinned, content properties, etc.) and optional `orderBy` (create_time / update_time; defaults to the workspace setting) |
| `get_memo` | Get a single memo by numeric ID or UID string |
| `create_memo` | Create a new memo with markdown content, optional `createTime` to backdate |
| `update_memo` | Update content, visibility, pin, archive state, or override `createTime` / `updateTime`; optional `preserveUpdateTime` for style-only edits |
| `delete_memo` | Permanently delete a memo |

### Tags

| Tool | Description |
|------|-------------|
| `list_tags` | List tags with usage counts, hierarchy support, and pinned/emoji metadata |
| `update_tag` | Update a tag's pinned status or emoji |
| `rename_tag` | Rename a tag across all memos |

### Resources

| Tool | Description |
|------|-------------|
| `list_resources` | List all resources (attachments) |
| `upload_resource` | Upload a file (base64 encoded), with optional memo linking |
| `delete_resource` | Delete a resource |

### Relations

| Tool | Description |
|------|-------------|
| `list_memo_relations` | List memo relations with recursive graph traversal (depth 1-5) |
| `set_memo_relations` | Add or remove REFERENCE relations between memos |

### Review

| Tool | Description |
|------|-------------|
| `get_review_memos` | Get today's spaced-repetition review batch |
| `complete_review` | Mark the current review batch as completed |
| `get_on_this_day_memos` | Get memos created on this day in previous years, grouped by year |
| `update_review_setting` | Update review preferences (batch size, tag filters) |

## Prompts

| Prompt | Description |
|--------|-------------|
| `capture` | Quick-save a thought as a memo |
| `review` | Start a guided spaced-repetition review session |
| `on_this_day` | See memos from this day in previous years |
| `digest` | Summarize memo activity for a time period (today/week/month) |
| `tag_overview` | Review your tag system and organization |
| `relation_graph` | Explore the relation graph starting from a memo |

## Resources

| URI Template | Description |
|-------------|-------------|
| `memo://memos/{uid}` | Get a memo by UID as markdown |

## Development

```bash
git clone https://github.com/chriscurrycc/memos-mcp.git
cd memos-mcp
pnpm install
pnpm build

# Run in dev mode
MEMOS_URL=http://localhost:5230 MEMOS_TOKEN=your-token pnpm dev
```

## License

MIT
