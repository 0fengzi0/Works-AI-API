import type { D1Database } from "@cloudflare/workers-types";

export interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  UPSTREAM_BASE_URL?: string;
  UPSTREAM_API_KEY?: string;
}

export interface UserContext {
  id: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "disabled" | "frozen";
  tokenBalance: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: "user" | "admin";
  iat?: number;
  exp?: number;
}

export interface AppVariables {
  user: UserContext;
}
