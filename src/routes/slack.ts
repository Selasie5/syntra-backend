import { Router } from "express";
import crypto from "crypto";
import { handleListenerEvent } from "../agents/listenerAgent";
import { getThreadReplyCount, sendSlackNudge } from "../integrations/slack";

const router = Router();


router.post("/", async (req, res) => {
  const { user, text, channel, ts } = req.body;

  const event = {
    source: "slack" as const,
    type: "message" as const,
    payload: { user, text, channel },
  };

  await handleListenerEvent(event);

  // Optional delayed check: if a message has no replies after a window, offer help
  const delayMs = parseInt(process.env.SLACK_UNANSWERED_DELAY_MS || "0");
  if (channel && ts && delayMs > 0) {
    setTimeout(async () => {
      const count = await getThreadReplyCount(channel, ts);
      if (count <= 1) { // only the root message
        await sendSlackNudge({ channel, message: "Need a hand? I can help clarify or route your question." });
      }
    }, delayMs);
  }
  res.json({ ok: true });
});

// Slack Events API endpoint
router.post("/events", async (req: any, res) => {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  const disableSlackVerify = String(process.env.DISABLE_SLACK_VERIFY).toLowerCase() === "true";

  // URL verification challenge
  if (req.body?.type === "url_verification" && req.body?.challenge) {
    return res.send(req.body.challenge);
  }

  // Verify Slack signature (unless disabled)
  if (signingSecret && !disableSlackVerify) {
    const timestamp = req.headers["x-slack-request-timestamp"] as string;
    const sig = req.headers["x-slack-signature"] as string;
    if (!timestamp || !sig) return res.status(401).end();
    const fiveMinutes = 60 * 5;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > fiveMinutes) return res.status(401).end();
    const base = `v0:${timestamp}:${req.rawBody || ""}`;
    const hmac = crypto.createHmac("sha256", signingSecret).update(base).digest("hex");
    const expected = `v0=${hmac}`;
    if (expected !== sig) return res.status(401).end();
  }

  const ev = req.body?.event;
  if (ev && ev.type === "message" && ev.channel_type === "channel" && !ev.bot_id) {
    const event = {
      source: "slack" as const,
      type: "message" as const,
      payload: {
        user: ev.user,
        text: ev.text,
        channel: ev.channel,
        ts: ev.ts,
      },
    };
    await handleListenerEvent(event as any);
  }
  res.json({ ok: true });
});

export default router
