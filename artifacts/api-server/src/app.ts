import express, { type Express } from "express";
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

export default app;
