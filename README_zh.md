# memos-mcp

[Memos](https://github.com/chriscurrycc/memos) 的 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 服务器 — 一个自托管的笔记服务。

[English](README.md)

让 AI 助手（Claude Code、Claude Desktop、Cursor 等）通过标准化接口读写你的 Memos。

## 配置

### 前置条件

- Node.js >= 18
- 一个运行中的 Memos 实例
- Memos 访问令牌（设置 → 访问令牌）

### Claude Code

```bash
claude mcp add memos -- npx @chriscurrycc/memos-mcp
```

然后设置环境变量：

```bash
export MEMOS_URL=https://your-memos-instance.com
export MEMOS_TOKEN=your-access-token
```

### Claude Desktop

在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "memos": {
      "command": "npx",
      "args": ["-y", "memos-mcp"],
      "env": {
        "MEMOS_URL": "https://your-memos-instance.com",
        "MEMOS_TOKEN": "your-access-token"
      }
    }
  }
}
```

### 配合 1Password 使用（推荐）

使用 `op run` 安全注入令牌，避免明文存储：

```json
{
  "mcpServers": {
    "memos": {
      "command": "op",
      "args": ["run", "--", "npx", "-y", "memos-mcp"],
      "env": {
        "MEMOS_URL": "https://your-memos-instance.com",
        "MEMOS_TOKEN": "op://Personal/memos-api/token"
      }
    }
  }
}
```

## 工具

### Memos

| 工具 | 描述 |
|------|------|
| `list_memos` | 列出 Memo，支持筛选和分页 |
| `get_memo` | 根据 ID 获取单条 Memo |
| `search_memos` | 按关键词搜索 Memo |
| `create_memo` | 创建新 Memo |
| `update_memo` | 更新内容、可见性、置顶或归档状态 |
| `delete_memo` | 永久删除 Memo |

### 评论

| 工具 | 描述 |
|------|------|
| `list_memo_comments` | 列出 Memo 的评论 |
| `create_memo_comment` | 给 Memo 添加评论 |

### 标签

| 工具 | 描述 |
|------|------|
| `list_pinned_tags` | 列出所有置顶标签 |
| `list_tags_with_emoji` | 列出带有 Emoji 的标签 |
| `update_tag` | 更新标签的 Emoji 或置顶状态 |

### 资源

| 工具 | 描述 |
|------|------|
| `list_resources` | 列出所有资源（附件） |
| `get_resource` | 根据 ID 获取资源 |
| `delete_resource` | 删除资源 |
| `link_resource_to_memo` | 将资源关联到 Memo |

### 关联

| 工具 | 描述 |
|------|------|
| `list_memo_relations` | 列出 Memo 的关联关系 |
| `set_memo_relations` | 设置关联关系（全量替换） |
| `delete_memo_relation` | 移除指定关联关系 |

### 反应

| 工具 | 描述 |
|------|------|
| `list_reactions` | 列出 Memo 的反应 |
| `upsert_reaction` | 添加 Emoji 反应 |
| `delete_reaction` | 移除反应 |

### 复习（间隔重复）

| 工具 | 描述 |
|------|------|
| `list_review_memos` | 获取待复习的 Memo |
| `get_random_memo` | 随机获取一条 Memo |
| `list_on_this_day_memos` | 历史上的今天创建的 Memo |
| `get_time_travel_memos` | 获取随机时间段的 Memo |
| `record_review` | 记录 Memo 已被复习 |
| `get_review_stats` | 获取复习统计信息 |

## 提示词

| 提示词 | 描述 |
|--------|------|
| `capture` | 快速保存一个想法为 Memo |
| `review` | 开始一次引导式复习 |
| `daily_digest` | 总结近期 Memo 活动 |

## 资源

| URI 模板 | 描述 |
|----------|------|
| `memo://memos/{uid}` | 通过 UID 获取 Memo（Markdown 格式） |

## 开发

```bash
git clone https://github.com/chriscurrycc/memos-mcp.git
cd memos-mcp
pnpm install
pnpm build

# 开发模式运行
MEMOS_URL=http://localhost:5230 MEMOS_TOKEN=your-token pnpm dev
```

## 许可证

MIT
