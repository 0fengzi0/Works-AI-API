import { Hono } from "hono";
import { z } from "zod";
import { auth } from "../middleware/auth";
import type { AppVariables, Env, UserContext } from "../types";
import { generateToken, generateUUID, hashPassword } from "../utils/crypto";
import { error, success } from "../utils/response";

const keys = new Hono<{ Bindings: Env; Variables: AppVariables }>();
const createSchema = z.object({ name: z.string().min(1).max(80) });

keys.use("*", auth);

keys.get("/", async (c) => {
  const user = c.get("user") as UserContext;
  const rows = await c.env.DB.prepare(
    "SELECT id, name, key_prefix AS keyPrefix, status, last_used_at AS lastUsedAt, created_at AS createdAt FROM user_api_keys WHERE user_id = ? ORDER BY created_at DESC",
  ).bind(user.id).all();
  return success(c, rows.results);
});

keys.post("/", async (c) => {
  const parsed = createSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Invalid key name");
  const user = c.get("user") as UserContext;
  const plainKey = `wai-${generateToken(32)}`;
  const id = generateUUID();
  await c.env.DB.prepare(
    "INSERT INTO user_api_keys (id, user_id, name, key_hash, key_prefix) VALUES (?, ?, ?, ?, ?)",
  ).bind(id, user.id, parsed.data.name, await hashPassword(plainKey), `${plainKey.slice(0, 12)}...${plainKey.slice(-6)}`).run();
  return success(c, { id, key: plainKey }, "Created. Store this key now; it will not be shown again.");
});

keys.patch("/:id/status", async (c) => {
  const body = z.object({ status: z.enum(["active", "disabled"]) }).safeParse(await c.req.json().catch(() => null));
  if (!body.success) return error(c, "Invalid status");
  const user = c.get("user") as UserContext;
  await c.env.DB.prepare("UPDATE user_api_keys SET status = ? WHERE id = ? AND user_id = ?").bind(body.data.status, c.req.param("id"), user.id).run();
  return success(c, true);
});

keys.delete("/:id", async (c) => {
  const user = c.get("user") as UserContext;
  await c.env.DB.prepare("DELETE FROM user_api_keys WHERE id = ? AND user_id = ?").bind(c.req.param("id"), user.id).run();
  return success(c, true);
});

export { keys };
