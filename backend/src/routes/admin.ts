import { Hono } from "hono";
import { z } from "zod";
import { adminOnly, auth } from "../middleware/auth";
import type { AppVariables, Env } from "../types";
import { generateToken, generateUUID } from "../utils/crypto";
import { error, success } from "../utils/response";

const admin = new Hono<{ Bindings: Env; Variables: AppVariables }>();
admin.use("*", auth, adminOnly);

admin.get("/dashboard", async (c) => {
  const [users, calls, cost, vouchers] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM users").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM api_logs").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COALESCE(SUM(total_cost), 0) AS total FROM api_logs").first<{ total: number }>(),
    c.env.DB.prepare("SELECT COUNT(*) AS total FROM vouchers").first<{ total: number }>(),
  ]);
  return success(c, { users: users?.total ?? 0, calls: calls?.total ?? 0, cost: cost?.total ?? 0, vouchers: vouchers?.total ?? 0 });
});

admin.get("/users", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, email, role, status, token_balance AS tokenBalance, created_at AS createdAt, updated_at AS updatedAt FROM users ORDER BY created_at DESC LIMIT 200",
  ).all();
  return success(c, rows.results);
});

admin.patch("/users/:id/status", async (c) => {
  const parsed = z.object({ status: z.enum(["active", "disabled", "frozen"]) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Invalid user status");
  await c.env.DB.prepare("UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(parsed.data.status, c.req.param("id")).run();
  return success(c, true);
});

admin.get("/vouchers", async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, code, amount, status, used_by AS usedBy, used_at AS usedAt, created_at AS createdAt FROM vouchers ORDER BY created_at DESC LIMIT 200",
  ).all();
  return success(c, rows.results);
});

admin.post("/vouchers", async (c) => {
  const parsed = z.object({ amount: z.number().int().positive(), count: z.number().int().min(1).max(100) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Invalid voucher payload");
  const created = Array.from({ length: parsed.data.count }, () => ({ id: generateUUID(), code: `WAI-${generateToken(12).toUpperCase()}`, amount: parsed.data.amount }));
  await c.env.DB.batch(created.map((item) => c.env.DB.prepare("INSERT INTO vouchers (id, code, amount) VALUES (?, ?, ?)").bind(item.id, item.code, item.amount)));
  return success(c, created);
});

admin.patch("/vouchers/:id/cancel", async (c) => {
  await c.env.DB.prepare("UPDATE vouchers SET status = 'cancelled' WHERE id = ? AND status = 'unused'").bind(c.req.param("id")).run();
  return success(c, true);
});

admin.get("/channel-keys", async (c) => {
  const rows = await c.env.DB.prepare("SELECT id, channel_id AS channelId, name, status, usage_count AS usageCount, failure_count AS failureCount, created_at AS createdAt FROM channel_keys ORDER BY created_at DESC").all();
  return success(c, rows.results);
});

admin.post("/channel-keys", async (c) => {
  const parsed = z.object({ channelId: z.string().min(1), name: z.string().min(1), apiKey: z.string().min(1) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Invalid channel key payload");
  const id = generateUUID();
  await c.env.DB.prepare("INSERT INTO channel_keys (id, channel_id, name, api_key) VALUES (?, ?, ?, ?)").bind(id, parsed.data.channelId, parsed.data.name, parsed.data.apiKey).run();
  return success(c, { id });
});

admin.get("/settings", async (c) => {
  const rows = await c.env.DB.prepare("SELECT key, value, updated_at AS updatedAt FROM system_settings ORDER BY key").all();
  return success(c, rows.results);
});

admin.put("/settings/:key", async (c) => {
  const parsed = z.object({ value: z.string() }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Invalid setting value");
  await c.env.DB.prepare("INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP").bind(c.req.param("key"), parsed.data.value).run();
  return success(c, true);
});

export { admin };
