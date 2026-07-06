import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Resolve the Clerk publishable key with multiple fallbacks:
// 1. CLERK_PUBLISHABLE_KEY (explicit, preferred)
// 2. VITE_CLERK_PUBLISHABLE_KEY (set in VPS .env for frontend builds)
// 3. Derived from the request Host header (multi-domain / proxy fallback)
const staticPublishableKey =
  process.env.CLERK_PUBLISHABLE_KEY ??
  process.env.VITE_CLERK_PUBLISHABLE_KEY;

app.use(
  clerkMiddleware((req) => ({
    publishableKey:
      staticPublishableKey ??
      publishableKeyFromHost(getClerkProxyHost(req) ?? "", undefined),
    secretKey: process.env.CLERK_SECRET_KEY,
  })),
);

app.use("/api", router);

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  logger.error(
    {
      err,
      method: req.method,
      url: req.originalUrl?.split("?")[0],
      stack: err instanceof Error ? err.stack : undefined,
      message: err instanceof Error ? err.message : String(err),
    },
    "Unhandled request error",
  );
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
