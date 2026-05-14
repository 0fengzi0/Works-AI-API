import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { handleError } from "./utils/response";
import { health } from "./routes/health";
import { authRoutes } from "./routes/auth";
import { keys } from "./routes/keys";
import { models } from "./routes/models";
import { recharge } from "./routes/recharge";
import { logs } from "./routes/logs";
import { admin } from "./routes/admin";
import { chat } from "./routes/chat";
import type { AppVariables, Env } from "./types";

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

const api = new Hono<{ Bindings: Env; Variables: AppVariables }>();

// Global middleware
app.use("*", cors({ origin: "*", credentials: true }));
app.use("*", logger());

// Error handler
app.onError(handleError);

// Mount routes
api.route("/", health);
api.route("/auth", authRoutes);
api.route("/keys", keys);
api.route("/models", models);
api.route("/recharge", recharge);
api.route("/logs", logs);
api.route("/admin", admin);
api.route("/v1", chat);

app.route("/api", api);
app.route("/v1", chat);

export default app;
