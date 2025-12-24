import * as dotenv from 'dotenv';
dotenv.config();
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.ts";
import { serveStatic } from "./static.ts";
import { createServer } from "http";

const app = express();

/**
 * FIX 1: Trust Proxy
 * This is crucial for session persistence. It tells Express to trust the 
 * headers set by the development proxy (Vite) so that the session cookie 
 * is correctly saved in your browser.
 */
app.set("trust proxy", 1);

const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Logging Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Routes are registered here
  await registerRoutes(httpServer, app);

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite.ts");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "127.0.0.1"; // Changed to 0.0.0.0 for better accessibility

  httpServer.listen(port, host, () => {
    log(`serving at http://${host}:${port}`);
  });
})();