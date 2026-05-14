import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";
import type { AppVariables, Env, JwtPayload, UserContext } from "../types";

function getJwtSecret(secret?: string): Uint8Array {
  return new TextEncoder().encode(secret || "works-ai-api-dev-secret-change-in-production");
}

export const auth = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ code: 401, message: "Missing or invalid token" }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const env = c.env as Env;
    const { payload } = await jwtVerify(token, getJwtSecret(env.JWT_SECRET));
    const jwtPayload = payload as unknown as JwtPayload;
    const user = await env.DB.prepare(
      "SELECT id, email, role, status, token_balance AS tokenBalance FROM users WHERE id = ?",
    ).bind(jwtPayload.sub).first<UserContext>();

    if (!user) {
      return c.json({ code: 401, message: "User not found" }, 401);
    }

    if (user.status !== "active") {
      return c.json({ code: 403, message: "Account is not active" }, 403);
    }

    c.set("user", user);
    await next();
  } catch {
    return c.json({ code: 401, message: "Invalid or expired token" }, 401);
  }
});

export const adminOnly = createMiddleware<{ Bindings: Env; Variables: AppVariables }>(async (c, next) => {
  const user = c.get("user") as UserContext | undefined;
  if (!user || user.role !== "admin") {
    return c.json({ code: 403, message: "Admin permission required" }, 403);
  }
  await next();
});
