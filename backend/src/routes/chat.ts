import { Hono } from "hono";
import { z } from "zod";
import type { Env, UserContext } from "../types";
import { generateUUID, verifyPassword } from "../utils/crypto";

const chat = new Hono<{ Bindings: Env }>();

const chatSchema = z.object({
  model: z.string().min(1),
  messages: z.array(z.object({ role: z.string(), content: z.union([z.string(), z.array(z.unknown())]) })).min(1),
  stream: z.boolean().optional(),
});

async function authenticateApiKey(env: Env, header: string | undefined): Promise<UserContext | null> {
  if (!header?.startsWith("Bearer ")) return null;
  const plainKey = header.slice(7);
  const rows = await env.DB.prepare(
    "SELECT k.id, k.key_hash AS keyHash, u.id AS userId, u.email, u.role, u.status, u.token_balance AS tokenBalance FROM user_api_keys k JOIN users u ON u.id = k.user_id WHERE k.status = 'active'",
  ).all<{ id: string; keyHash: string; userId: string; email: string; role: "user" | "admin"; status: "active" | "disabled" | "frozen"; tokenBalance: number }>();

  for (const row of rows.results) {
    if (await verifyPassword(plainKey, row.keyHash)) {
      await env.DB.prepare("UPDATE user_api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ?").bind(row.id).run();
      return { id: row.userId, email: row.email, role: row.role, status: row.status, tokenBalance: row.tokenBalance };
    }
  }
  return null;
}

function estimateTokens(messages: Array<{ content: string | unknown[] }>): number {
  return Math.max(1, Math.ceil(JSON.stringify(messages).length / 4));
}

chat.post("/chat/completions", async (c) => {
  const started = Date.now();
  const user = await authenticateApiKey(c.env, c.req.header("Authorization"));
  if (!user || user.status !== "active") return c.json({ error: { message: "Invalid API key" } }, 401);

  const parsed = chatSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: { message: "Invalid request body" } }, 400);

  const model = await c.env.DB.prepare(
    "SELECT id, channel_id AS channelId, real_model AS realModel, display_name AS displayName, input_price AS inputPrice, output_price AS outputPrice, status FROM models WHERE id = ? OR real_model = ? LIMIT 1",
  ).bind(parsed.data.model, parsed.data.model).first<{ id: string; channelId: string; realModel: string; displayName: string; inputPrice: number; outputPrice: number; status: string }>();
  if (!model || model.status !== "active") return c.json({ error: { message: "Model is unavailable" } }, 404);
  if (user.tokenBalance <= 0) return c.json({ error: { message: "Insufficient token balance" } }, 402);

  const inputTokens = estimateTokens(parsed.data.messages);
  const reply = `Works-AI-API mock response for ${model.displayName}. Configure channel keys/upstream to enable real forwarding.`;
  const outputTokens = Math.ceil(reply.length / 4);
  const totalCost = inputTokens * model.inputPrice + outputTokens * model.outputPrice;
  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE users SET token_balance = MAX(token_balance - ?, 0), updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(totalCost, user.id),
    c.env.DB.prepare("INSERT INTO api_logs (id, user_id, user_email, model_id, model_name, channel_id, input_tokens, output_tokens, total_cost, duration, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'success')").bind(generateUUID(), user.id, user.email, model.id, model.displayName, model.channelId, inputTokens, outputTokens, totalCost, Date.now() - started),
  ]);

  if (parsed.data.stream) {
    const encoder = new TextEncoder();
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ id: `chatcmpl-${generateUUID()}`, object: "chat.completion.chunk", choices: [{ delta: { content: reply }, index: 0, finish_reason: null }] })}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(body, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  }

  return c.json({
    id: `chatcmpl-${generateUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: parsed.data.model,
    choices: [{ index: 0, message: { role: "assistant", content: reply }, finish_reason: "stop" }],
    usage: { prompt_tokens: inputTokens, completion_tokens: outputTokens, total_tokens: inputTokens + outputTokens },
  });
});

export { chat };
