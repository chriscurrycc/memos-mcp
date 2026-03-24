# memos-mcp

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [Memos](https://github.com/chriscurrycc/memos) — a self-hosted note-taking service.

[中文文档](README_zh.md)

Enables AI assistants (Claude Code, Claude Desktop, Cursor, etc.) to read and write your memos through a standardized interface.

## Setup

### Prerequisites

- Node.js >= 18
- A running Memos instance
- A Memos access token (Settings → Access Tokens)

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
| `list_memos` | List memos with filtering and pagination |
| `get_memo` | Get a single memo by ID |
| `search_memos` | Search memos by keyword |
| `create_memo` | Create a new memo |
| `update_memo` | Update content, visibility, pin, or archive state |
| `delete_memo` | Permanently delete a memo |

### Comments

| Tool | Description |
|------|-------------|
| `list_memo_comments` | List comments on a memo |
| `create_memo_comment` | Add a comment to a memo |

### Tags

| Tool | Description |
|------|-------------|
| `list_pinned_tags` | List all pinned tags |
| `list_tags_with_emoji` | List tags with their emojis |
| `update_tag` | Update a tag's emoji or pinned status |

### Resources

| Tool | Description |
|------|-------------|
| `list_resources` | List all resources (attachments) |
| `get_resource` | Get a resource by ID |
| `delete_resource` | Delete a resource |
| `link_resource_to_memo` | Link resources to a memo |

### Relations

| Tool | Description |
|------|-------------|
| `list_memo_relations` | List memo relations |
| `set_memo_relations` | Set relations (replaces all) |
| `delete_memo_relation` | Remove a specific relation |

### Reactions

| Tool | Description |
|------|-------------|
| `list_reactions` | List reactions on a memo |
| `upsert_reaction` | Add a reaction emoji |
| `delete_reaction` | Remove a reaction |

### Review (Spaced Repetition)

| Tool | Description |
|------|-------------|
| `list_review_memos` | Get memos due for review |
| `get_random_memo` | Get a random memo |
| `list_on_this_day_memos` | Memos created on this day in past years |
| `get_time_travel_memos` | Memos from a random time period |
| `record_review` | Record that memos have been reviewed |
| `get_review_stats` | Get review statistics |

## Prompts

| Prompt | Description |
|--------|-------------|
| `capture` | Quick-save a thought as a memo |
| `review` | Start a guided review session |
| `daily_digest` | Summarize recent memo activity |

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
