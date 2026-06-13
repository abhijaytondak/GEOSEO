/** Shared list-query parsing + slicing. Defaults: limit 25 (max 100), offset 0. */
export function parsePaging(limit?: string, offset?: string) {
  const l = Math.min(100, Math.max(1, Number.parseInt(limit ?? "25", 10) || 25));
  const o = Math.max(0, Number.parseInt(offset ?? "0", 10) || 0);
  return { limit: l, offset: o };
}

export function paginate<T>(items: T[], limit?: string, offset?: string) {
  const { limit: l, offset: o } = parsePaging(limit, offset);
  return { items: items.slice(o, o + l), total: items.length, limit: l, offset: o };
}
