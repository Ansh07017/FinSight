// server/index.ts

import * as dotenv from 'dotenv';
dotenv.config();
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();

// Trust proxy is required for Render/Heroku to get real IP addresses
app.set("trust proxy", 1);

const httpServer = createServer(app);

export default app;

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
  // 1. Register API Routes
  await registerRoutes(httpServer, app);

  // 2. Global Error Handler (ENHANCED FOR DEBUGGING)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // 🚨 DEBUG: Print the REAL error reason to your terminal 🚨
    console.error("\n________________________");
    console.error("🚨 CRITICAL ERROR CAUGHT:");
    console.error("👉 Message:", message);
    if (err.code) console.error("👉 PG Code:", err.code); // e.g., 28P01 (Auth), 42P01 (Table Missing)
    if (err.detail) console.error("👉 Detail:", err.detail);
    if (err.hint) console.error("👉 Hint:", err.hint);
    console.error("________________________\n");

    res.status(status).json({ message });
  });

  // 3. Serve Frontend (Production vs Dev)
  if (app.get("env") === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // 4. Start Server
  const port = parseInt(process.env.PORT || "3000", 10);
  const host = "0.0.0.0"; // Binds to ALL interfaces (Required for Render)

  httpServer.listen(port, host, () => {
    // Custom log to help with Local Development confusion
    const displayUrl = host === "0.0.0.0" ? "localhost" : host;
    log(`Server running on http://${displayUrl}:${port}`);
  });
})();