import { Hono } from "hono";
import { z } from "zod";
import { auth } from "../middleware/auth";
import type { AppVariables, Env, UserContext } from "../types";
import { generateUUID } from "../utils/crypto";
import { error, success } from "../utils/response";

const recharge = new Hono<{ Bindings: Env; Variables: AppVariables }>();

recharge.post("/redeem", auth, async (c) => {
  const parsed = z.object({ code: z.string().min(4) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Invalid voucher code");
  const user = c.get("user") as UserContext;
  const voucher = await c.env.DB.prepare("SELECT id, amount, status FROM vouchers WHERE code = ?").bind(parsed.data.code).first<{ id: string; amount: number; status: string }>();
  if (!voucher || voucher.status !== "unused") return error(c, "Voucher is invalid or already used");

  await c.env.DB.batch([
    c.env.DB.prepare("UPDATE vouchers SET status = 'used', used_by = ?, used_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'unused'").bind(user.id, voucher.id),
    c.env.DB.prepare("UPDATE users SET token_balance = token_balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(voucher.amount, user.id),
    c.env.DB.prepare("INSERT INTO recharge_records (id, user_id, voucher_id, amount) VALUES (?, ?, ?, ?)").bind(generateUUID(), user.id, voucher.id, voucher.amount),
  ]);

  return success(c, { amount: voucher.amount });
});

recharge.get("/records", auth, async (c) => {
  const user = c.get("user") as UserContext;
  const rows = await c.env.DB.prepare(
    "SELECT r.id, r.amount, r.created_at AS createdAt, v.code FROM recharge_records r JOIN vouchers v ON v.id = r.voucher_id WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 50",
  ).bind(user.id).all();
  return success(c, rows.results);
});

export { recharge };
