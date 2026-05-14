import { Hono } from "hono";
import { z } from "zod";
import { adminOnly, auth } from "../middleware/auth";
import type { AppVariables, Env } from "../types";
import { generateUUID } from "../utils/crypto";
import { error, success } from "../utils/response";

const models = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const modelSchema = z.object({
  id: z.string().min(1).optional(),
  channelId: z.string().min(1),
  realModel: z.string().min(1),
  displayName: z.string().min(1),
  contextLength: z.number().int().positive(),
  inputPrice: z.number().int().nonnegative(),
  outputPrice: z.number().int().nonnegative(),
  status: z.enum(["active", "disabled"]),
  description: z.string().default(""),
});

models.get("/", auth, async (c) => {
  const rows = await c.env.DB.prepare(
    "SELECT id, channel_id AS channelId, real_model AS realModel, display_name AS displayName, context_length AS contextLength, input_price AS inputPrice, output_price AS outputPrice, status, description FROM models ORDER BY created_at DESC",
  ).all();
  return success(c, rows.results);
});

models.post("/", auth, adminOnly, async (c) => {
  const parsed = modelSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Invalid model payload");
  const id = parsed.data.id || generateUUID();
  await c.env.DB.prepare(
    "INSERT INTO models (id, channel_id, real_model, display_name, context_length, input_price, output_price, status, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).bind(id, parsed.data.channelId, parsed.data.realModel, parsed.data.displayName, parsed.data.contextLength, parsed.data.inputPrice, parsed.data.outputPrice, parsed.data.status, parsed.data.description).run();
  return success(c, { id });
});

models.put("/:id", auth, adminOnly, async (c) => {
  const parsed = modelSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Invalid model payload");
  await c.env.DB.prepare(
    "UPDATE models SET channel_id = ?, real_model = ?, display_name = ?, context_length = ?, input_price = ?, output_price = ?, status = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  ).bind(parsed.data.channelId, parsed.data.realModel, parsed.data.displayName, parsed.data.contextLength, parsed.data.inputPrice, parsed.data.outputPrice, parsed.data.status, parsed.data.description, c.req.param("id")).run();
  return success(c, true);
});

export { models };
