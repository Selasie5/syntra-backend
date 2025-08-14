import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import slackRoutes from "./routes/slack";
import notionRoutes from "./routes/notion";
import jiraRoutes from "./routes/jira";
import { initializeCollections } from "./data/chroma";
import { storeMemory, retrieveMemory } from "./agents/memoryAgent";
import { logger } from "./utils/logger";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
// Capture raw body for Slack signature verification for JSON
app.use(express.json({
  verify: (req: any, _res, buf) => {
    try { req.rawBody = buf.toString("utf8"); } catch { /* noop */ }
  },
}));
// Capture raw body for Slack signature verification for urlencoded
app.use(express.urlencoded({
  extended: true,
  verify: (req: any, _res, buf) => {
    try { req.rawBody = buf.toString("utf8"); } catch { /* noop */ }
  },
}));
// Behind proxies like ngrok, trust the first proxy hop
app.set("trust proxy", 1);
app.disable("x-powered-by");

// Rate limit all routes
const limiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  // Do not rate-limit Slack URL verification & events
  skip: (req) => req.path?.startsWith?.("/api/slack/events") === true,
});
app.use(limiter);

// Simple HMAC signature verification middleware
const SHARED_SECRET = process.env.INGEST_SECRET;
const DISABLE_SIG = String(process.env.DISABLE_INGEST_SIGNATURE).toLowerCase() === "true";
app.use((req, res, next) => {
  // Bypass for Slack-signed requests (Slack will be verified in its route using X-Slack-Signature)
  if (req.header("x-slack-signature")) return next();
  // Optionally bypass for Slack Events path explicitly
  if (req.path && req.path.startsWith("/api/slack/events")) return next();
  if (DISABLE_SIG) return next(); // disabled explicitly
  if (!SHARED_SECRET) return next(); // disabled when unset
  const signature = req.header("x-syntra-signature");
  if (!signature) return res.status(401).json({ error: "missing signature" });
  const bodyRaw = JSON.stringify(req.body || {});
  const expected = crypto.createHmac("sha256", SHARED_SECRET).update(bodyRaw).digest("hex");
  if (expected !== signature) return res.status(401).json({ error: "bad signature" });
  next();
});

// Example test route
app.get("/", (_req, res) => {
  res.json({ status: "ok", service: "syntra-backend", time: new Date().toISOString() });
});


app.use("/api/slack", slackRoutes);
app.use("/api/notion", notionRoutes);
app.use("/api/jira", jiraRoutes);


app.post("/api/memory", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  await storeMemory(text);
  res.json({ stored: true });
});

app.get("/api/memory/search", async (req, res) => {
  const q = (req.query.q as string) || "";
  if (!q) return res.status(400).json({ error: "q required" });
  const results = await retrieveMemory(q);
  res.json(results);
});

// Boot sequence
initializeCollections()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`Server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    logger.error("Failed to init collections", err);
    process.exit(1);
  });

// Error handler (after routes)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error("Unhandled error", { message: err?.message, stack: err?.stack });
  res.status(500).json({ error: "internal_error" });
});

export default app;
