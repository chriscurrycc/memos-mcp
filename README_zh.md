# memos-mcp

[Memos](https://github.com/chriscurrycc/memos) 的 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 服务器 — 一个自托管的笔记服务。

[English](README.md)

让 AI 助手（Claude Code、Claude Desktop、Cursor 等）通过标准化接口读写你的 Memos。

## 配置

### 前置条件

- Node.js >= 18
- 一个运行中的 Memos 实例
- Memos 访问令牌（设置 → 访问令牌）

### 环境变量

| 变量 | 必填 | 描述 |
|------|------|------|
| `MEMOS_URL` | 是 | Memos 实例地址 |
| `MEMOS_TOKEN` | 是 | Memos 访问令牌 |
| `MEMOS_DEFAULT_VISIBILITY` | 否 | 新建 Memo 的默认可见性（`PRIVATE`、`PROTECTED`、`PUBLIC`），默认为 `PRIVATE` |

### Claude Code

```bash
claude mcp add --scope user memos -e MEMOS_URL=https://your-memos-instance.com -e MEMOS_TOKEN=your-access-token -- npx -y @chriscurrycc/memos-mcp
```

### Claude Desktop

在 `claude_desktop_config.json` 中添加：

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

### 配合 1Password 使用（推荐）

将令牌安全存储在 1Password 中，避免明文存储。

1. 将令牌保存到 1Password：

```bash
op item create --category=apiCredential --title="memos-api" token=your-access-token "valid from[date]=2026-01-01" "expires[date]=2026-02-01"
```

2. 使用 `op run` 在运行时注入令牌：

**Claude Code：**

```bash
claude mcp add --scope user memos -e MEMOS_URL=https://your-memos-instance.com -e MEMOS_TOKEN=op://Personal/memos-api/token -- op run --no-masking -- npx -y @chriscurrycc/memos-mcp
```

**Claude Desktop：**

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

## 工具

### Memos

| 工具 | 描述 |
|------|------|
| `list_memos` | 搜索和列出 Memo，支持结构化筛选（关键词、标签、时间范围、可见性、置顶、内容属性等） |
| `get_memo` | 根据数字 ID 或 UID 字符串获取单条 Memo |
| `create_memo` | 创建新 Memo（Markdown 格式） |
| `update_memo` | 更新内容、可见性、置顶、归档状态，支持 `preserveUpdateTime` 保留更新时间 |
| `delete_memo` | 永久删除 Memo |

### 标签

| 工具 | 描述 |
|------|------|
| `list_tags` | 列出标签及使用次数，支持层级浏览和置顶/Emoji 元数据 |
| `update_tag` | 更新标签的置顶状态或 Emoji |
| `rename_tag` | 在所有 Memo 中重命名标签 |

### 资源

| 工具 | 描述 |
|------|------|
| `list_resources` | 列出所有资源（附件） |
| `upload_resource` | 上传文件（Base64 编码），可选关联到 Memo |
| `delete_resource` | 删除资源 |

### 关联

| 工具 | 描述 |
|------|------|
| `list_memo_relations` | 查看 Memo 关联关系，支持递归图遍历（深度 1-5） |
| `set_memo_relations` | 添加或移除 Memo 之间的引用关联 |

### 回顾

| 工具 | 描述 |
|------|------|
| `get_review_memos` | 获取今日间隔回顾批次 |
| `complete_review` | 标记当前回顾批次为已完成 |
| `get_on_this_day_memos` | 获取历史上的今天创建的 Memo，按年分组 |
| `update_review_setting` | 更新回顾设置（批次大小、标签筛选） |

## 提示词

| 提示词 | 描述 |
|--------|------|
| `capture` | 快速保存一个想法为 Memo |
| `review` | 开始一次引导式间隔回顾 |
| `on_this_day` | 查看历史上的今天 |
| `digest` | 总结指定时间段的 Memo 活动（今天/本周/本月） |
| `tag_overview` | 查看标签体系和组织结构 |
| `relation_graph` | 从某条 Memo 出发探索关系图谱 |

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
