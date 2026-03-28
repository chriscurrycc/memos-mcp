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
| `list_memos` | Search and list memos with structured filters (keyword, tags, date range, visibility, pinned, content properties, etc.) |
| `get_memo` | Get a single memo by numeric ID or UID string |
| `create_memo` | Create a new memo with markdown content |
| `update_memo` | Update content, visibility, pin, archive state, with optional `preserveUpdateTime` |
| `delete_memo` | Permanently delete a memo |

### Tags

| Tool | Description |
|------|-------------|
| `list_tags` | List tags with usage counts, hierarchy support, and pinned/emoji metadata |
| `update_tag` | Update a tag's pinned status or emoji |
| `rename_tag` | Rename a tag across all memos |

## Prompts

| Prompt | Description |
|--------|-------------|
| `capture` | Quick-save a thought as a memo |

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
