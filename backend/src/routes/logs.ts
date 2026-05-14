import { Hono } from "hono";
import { adminOnly, auth } from "../middleware/auth";
import type { AppVariables, Env, UserContext } from "../types";
import { success } from "../utils/response";

const logs = new Hono<{ Bindings: Env; Variables: AppVariables }>();

logs.get("/", auth, async (c) => {
  const user = c.get("user") as UserContext;
  const isAdmin = user.role === "admin" && c.req.query("scope") === "all";
  const sql = isAdmin
    ? "SELECT id, user_id AS userId, user_email AS userEmail, model_id AS modelId, model_name AS modelName, channel_id AS channelId, input_tokens AS inputTokens, output_tokens AS outputTokens, total_cost AS totalCost, duration, status, error_message AS errorMessage, created_at AS createdAt FROM api_logs ORDER BY created_at DESC LIMIT 100"
    : "SELECT id, user_id AS userId, user_email AS userEmail, model_id AS modelId, model_name AS modelName, channel_id AS channelId, input_tokens AS inputTokens, output_tokens AS outputTokens, total_cost AS totalCost, duration, status, error_message AS errorMessage, created_at AS createdAt FROM api_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 100";
  const rows = isAdmin ? await c.env.DB.prepare(sql).all() : await c.env.DB.prepare(sql).bind(user.id).all();
  return success(c, rows.results);
});

logs.get("/statistics", auth, async (c) => {
  const user = c.get("user") as UserContext;
  const isAdmin = user.role === "admin" && c.req.query("scope") === "all";
  const where = isAdmin ? "1 = 1" : "user_id = ?";
  const stmt = c.env.DB.prepare(
    `SELECT COUNT(*) AS totalCalls, COALESCE(SUM(total_cost), 0) AS totalCost, COALESCE(SUM(input_tokens), 0) AS inputTokens, COALESCE(SUM(output_tokens), 0) AS outputTokens FROM api_logs WHERE ${where}`,
  );
  const row = isAdmin ? await stmt.first() : await stmt.bind(user.id).first();
  return success(c, row || { totalCalls: 0, totalCost: 0, inputTokens: 0, outputTokens: 0 });
});

logs.get("/admin", auth, adminOnly, async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, user_id AS userId, user_email AS userEmail, model_name AS modelName, total_cost AS totalCost, status, error_message AS errorMessage, created_at AS createdAt FROM api_logs ORDER BY created_at DESC LIMIT 200",
  ).all();
  return success(c, rows.results);
});

export { logs };
