# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

memos-mcp is an MCP (Model Context Protocol) server for [Memos](https://github.com/usememos/memos), providing tools, prompts, and resources for memo management via Claude Code and Claude Desktop.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build (TypeScript → dist/)
pnpm build

# Run in dev mode
pnpm dev
```

## Architecture

- `src/index.ts` - CLI entry point
- `src/server.ts` - MCP server initialization and tool/prompt/resource registration
- `src/client.ts` - Memos API client (requires MEMOS_URL and MEMOS_TOKEN env vars)
- `src/types.ts` - TypeScript type definitions
- `src/tools/` - MCP tool implementations (memos, tags, resources, relations, review)
- `src/prompts/` - MCP prompt definitions (guided workflows)
- `src/resources/` - MCP resource handlers (memo:// URI scheme)

### Key Patterns

- Each domain module exports a `register*Tools` function for modular registration
- Zod schemas for input validation
- CEL filter expressions for Memos API queries
- Spaced-repetition review system with configurable batch sizes

## Project-Specific Notes

1. This project does not require typecheck and prettier operations
2. All GitHub operations (issues, PRs, etc.) should target the repository chriscurrycc/memos-mcp
