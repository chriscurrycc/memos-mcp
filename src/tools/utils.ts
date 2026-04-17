export const SNIPPET_MAX_LENGTH = 200;

export function compactProperty(property: Record<string, unknown> | undefined) {
  if (!property) return undefined;
  const truthy: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(property)) {
    if (v) truthy[k] = v;
  }
  return Object.keys(truthy).length > 0 ? truthy : undefined;
}

export function summarizeMemo(memo: Record<string, unknown>) {
  const content = (memo.content as string) || "";
  const snippet =
    content.length > SNIPPET_MAX_LENGTH
      ? content.slice(0, SNIPPET_MAX_LENGTH) + "..."
      : content;

  const name = memo.name as string;
  const id = name?.match(/^memos\/(\d+)$/)?.[1];

  const summary: Record<string, unknown> = {
    id: id ? Number(id) : undefined,
    uid: memo.uid,
    createTime: memo.createTime,
    snippet,
    tags: memo.tags,
    visibility: memo.visibility,
  };

  if (memo.updateTime && memo.updateTime !== memo.createTime) {
    summary.updateTime = memo.updateTime;
  }

  if (memo.pinned) summary.pinned = true;

  const property = compactProperty(memo.property as Record<string, unknown> | undefined);
  if (property) summary.property = property;

  return summary;
}
