import { Hono } from "hono";
import { SignJWT } from "jose";
import { z } from "zod";
import { auth } from "../middleware/auth";
import type { AppVariables, Env, UserContext } from "../types";
import { hashPassword, verifyPassword, generateUUID } from "../utils/crypto";
import { error, success } from "../utils/response";

const authRoutes = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[A-Za-z]/).regex(/[0-9]/),
});

function publicUser(user: UserContext & { createdAt?: string; updatedAt?: string }) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    tokenBalance: user.tokenBalance,
    createdAt: user.createdAt || "",
    updatedAt: user.updatedAt || "",
  };
}

async function signToken(env: Env, user: Pick<UserContext, "id" | "email" | "role">): Promise<string> {
  const secret = new TextEncoder().encode(env.JWT_SECRET || "works-ai-api-dev-secret-change-in-production");
  return new SignJWT({ email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

authRoutes.post("/register", async (c) => {
  const parsed = credentialsSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Email or password format is invalid");

  const existing = await c.env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(parsed.data.email).first();
  if (existing) return error(c, "Email already registered", 409, 409);

  const userCount = await c.env.DB.prepare("SELECT COUNT(*) AS total FROM users").first<{ total: number }>();
  const id = generateUUID();
  const role = userCount?.total === 0 ? "admin" : "user";
  const passwordHash = await hashPassword(parsed.data.password);

  await c.env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, role, token_balance) VALUES (?, ?, ?, ?, ?)",
  ).bind(id, parsed.data.email, passwordHash, role, 100000).run();

  const user = await c.env.DB.prepare(
    "SELECT id, email, role, status, token_balance AS tokenBalance, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE id = ?",
  ).bind(id).first<UserContext & { createdAt: string; updatedAt: string }>();
  if (!user) return error(c, "Registration failed", 500, 500);

  return success(c, { token: await signToken(c.env, user), user: publicUser(user) });
});

authRoutes.post("/login", async (c) => {
  const parsed = credentialsSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return error(c, "Email or password format is invalid");

  const row = await c.env.DB.prepare(
    "SELECT id, email, password_hash AS passwordHash, role, status, token_balance AS tokenBalance, created_at AS createdAt, updated_at AS updatedAt FROM users WHERE email = ?",
  ).bind(parsed.data.email).first<UserContext & { passwordHash: string; createdAt: string; updatedAt: string }>();
  if (!row || !(await verifyPassword(parsed.data.password, row.passwordHash))) {
    return error(c, "Invalid email or password", 401, 401);
  }
  if (row.status !== "active") return error(c, "Account is not active", 403, 403);

  return success(c, { token: await signToken(c.env, row), user: publicUser(row) });
});

authRoutes.get("/me", auth, async (c) => {
  const user = c.get("user") as UserContext;
  return success(c, publicUser(user));
});

export { authRoutes };
