import { type Server } from "node:http";

import express, {
  type Express,
  type Request,
  Response,
  NextFunction,
} from "express";

import { registerRoutes } from "./routes";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

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

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

export default async function runApp(
  setup: (app: Express, server: Server) => Promise<void>,
) {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly run the final setup after setting up all the other routes so
  // the catch-all route doesn't interfere with the other routes
  await setup(app, server);

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const listenOptions: any = {
    port,
    host: "0.0.0.0",
  };

  // `reusePort` is not supported on some platforms (notably Windows). Only
  // enable it when not running on Windows to avoid ENOTSUP errors.
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }

  // Print a masked environment summary for quick verification
  function mask(val?: string) {
    if (!val) return "(missing)";
    if (val.length <= 4) return val;
    return `${val.slice(0, 4)}…${val.slice(-3)}`;
  }

  const envSummary = {
    SMTP_USER: mask(process.env.SMTP_USER || process.env.EMAIL_USER),
    SMTP_PASS: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD ? "***" : "(missing)",
    SMTP_HOST: process.env.SMTP_HOST || "(missing)",
    SMTP_PORT: process.env.SMTP_PORT || "(missing)",
    SMTP_SERVICE: process.env.SMTP_SERVICE || "(none)",
    ADMIN_EMAIL: mask(process.env.ADMIN_EMAIL || process.env.SMTP_USER),
    FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY ? "OK" : "(missing)",
    FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY ? "OK" : "(missing)",
    FLUTTERWAVE_WEBHOOK_SECRET: process.env.FLUTTERWAVE_WEBHOOK_SECRET ? "OK" : "(missing)",
  };

  console.log("Loaded ENV:");
  console.log(` - SMTP_USER: ${envSummary.SMTP_USER}`);
  console.log(` - SMTP_PASS: ${envSummary.SMTP_PASS}`);
  console.log(` - SMTP_HOST: ${envSummary.SMTP_HOST}`);
  console.log(` - SMTP_PORT: ${envSummary.SMTP_PORT}`);
  console.log(` - SMTP_SERVICE: ${envSummary.SMTP_SERVICE}`);
  console.log(` - ADMIN_EMAIL: ${envSummary.ADMIN_EMAIL}`);
  console.log(` - FLUTTERWAVE_PUBLIC_KEY: ${envSummary.FLUTTERWAVE_PUBLIC_KEY}`);
  console.log(` - FLUTTERWAVE_SECRET_KEY: ${envSummary.FLUTTERWAVE_SECRET_KEY}`);
  console.log(` - FLUTTERWAVE_WEBHOOK_SECRET: ${envSummary.FLUTTERWAVE_WEBHOOK_SECRET}`);

  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });
}
