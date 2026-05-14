import type { D1Database } from "@cloudflare/workers-types";

export interface PageQuery {
  page: number;
  pageSize: number;
  offset: number;
}

export function pageQuery(url: URL): PageQuery {
  const page = Math.max(Number(url.searchParams.get("page") || "1"), 1);
  const pageSize = Math.min(Math.max(Number(url.searchParams.get("pageSize") || "20"), 1), 100);
  return { page, pageSize, offset: (page - 1) * pageSize };
}

export async function count(db: D1Database, table: string, where = "1 = 1"): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS total FROM ${table} WHERE ${where}`).first<{ total: number }>();
  return row?.total ?? 0;
}

export function nowIso(): string {
  return new Date().toISOString();
}
