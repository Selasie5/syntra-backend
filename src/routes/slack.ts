import { Router } from "express";
import crypto from "crypto";
import { handleListenerEvent } from "../agents/listenerAgent";
import { logger } from "../utils/logger";
import { getThreadReplyCount, sendSlackNudge } from "../integrations/slack";

const router = Router();


router.post("/", async (req: any, res) => {
  // Support Slack Events URL verification if Request URL points to /api/slack
  if (req.body?.type === "url_verification" && req.body?.challenge) {
  logger.info("slack.url_verification", { path: "/api/slack", challengeLen: String(req.body.challenge).length });
    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send(String(req.body.challenge));
  }

  // If Slack sends full Events API payloads to /api/slack (not /events), handle them here
  if (req.body?.type === "event_callback" && req.body?.event) {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    const disableSlackVerify = String(process.env.DISABLE_SLACK_VERIFY).toLowerCase() === "true";
    if (signingSecret && !disableSlackVerify) {
      const timestamp = req.headers["x-slack-request-timestamp"] as string;
      const sig = req.headers["x-slack-signature"] as string;
      if (!timestamp || !sig) {
        logger.warn("slack.missing_signature", { path: "/api/slack" });
        return res.status(401).end();
      }
      const fiveMinutes = 60 * 5;
      if (Math.abs(Date.now() / 1000 - Number(timestamp)) > fiveMinutes) {
        logger.warn("slack.stale_request", { path: "/api/slack", timestamp });
        return res.status(401).end();
      }
      const base = `v0:${timestamp}:${req.rawBody || ""}`;
      const hmac = crypto.createHmac("sha256", signingSecret).update(base).digest("hex");
      const expected = `v0=${hmac}`;
      if (expected !== sig) {
        logger.warn("slack.bad_signature", { path: "/api/slack" });
        return res.status(401).end();
      }
    }

    // Ack immediately
    logger.info("slack.event.ack", { path: "/api/slack" });
    res.json({ ok: true });

  const ev = req.body.event;
  logger.info("slack.event.summary", { path: "/api/slack", type: ev?.type, subtype: ev?.subtype, bot: Boolean(ev?.bot_id), channel: ev?.channel, channel_type: ev?.channel_type });
    // Process only real user messages in channels
    if (ev && ev.type === "message" && !ev.bot_id && (!ev.subtype || ev.subtype === "")) {
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
      try {
        logger.info("slack.event.message", { path: "/api/slack", user: ev.user, channel: ev.channel });
        await handleListenerEvent(event as any);
      } catch (err: any) {
        logger.error("slack.event.error", { message: err?.message });
      }

      // Optional delayed unanswered nudge
      const delayMs = parseInt(process.env.SLACK_UNANSWERED_DELAY_MS || "0");
      if (ev.channel && ev.ts && delayMs > 0) {
        logger.info("slack.unanswered.schedule", { path: "/api/slack", inMs: delayMs, channel: ev.channel });
        setTimeout(async () => {
          try {
            const count = await getThreadReplyCount(ev.channel, ev.ts);
            if (count <= 1) {
              await sendSlackNudge({ channel: ev.channel, message: "Need a hand? I can help clarify or route your question." });
            }
          } catch (e: any) {
            logger.warn("slack.unanswered.check_failed", { message: e?.message });
          }
        }, delayMs);
      }
    } else if (ev && ev.type === "app_mention") {
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
      try {
        logger.info("slack.event.app_mention", { path: "/api/slack", user: ev.user, channel: ev.channel });
        await handleListenerEvent(event as any);
      } catch (err: any) {
        logger.error("slack.event.error", { message: err?.message });
      }
    } else {
      logger.debug?.("slack.event.ignored", { path: "/api/slack", reason: ev?.bot_id ? "bot" : ev?.subtype ? `subtype:${ev.subtype}` : "non-message" });
    }
    return; // already acked
  }

  const { user, text, channel, ts } = req.body;

  const event = {
    source: "slack" as const,
    type: "message" as const,
    payload: { user, text, channel },
  };

  logger.info("slack.manual.ingest", { user, channel, hasText: Boolean(text) });
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
    // Reply with the plain challenge string
  logger.info("slack.url_verification", { path: "/api/slack/events", challengeLen: String(req.body.challenge).length });
    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send(String(req.body.challenge));
  }

  // Verify Slack signature (unless disabled)
  if (signingSecret && !disableSlackVerify) {
    const timestamp = req.headers["x-slack-request-timestamp"] as string;
    const sig = req.headers["x-slack-signature"] as string;
    if (!timestamp || !sig) {
      logger.warn("slack.missing_signature", { path: "/api/slack/events" });
      return res.status(401).end();
    }
    const fiveMinutes = 60 * 5;
    if (Math.abs(Date.now() / 1000 - Number(timestamp)) > fiveMinutes) {
      logger.warn("slack.stale_request", { path: "/api/slack/events", timestamp });
      return res.status(401).end();
    }
    const base = `v0:${timestamp}:${req.rawBody || ""}`;
    const hmac = crypto.createHmac("sha256", signingSecret).update(base).digest("hex");
    const expected = `v0=${hmac}`;
    if (expected !== sig) {
      logger.warn("slack.bad_signature", { path: "/api/slack/events" });
      return res.status(401).end();
    }
  }

  // Acknowledge immediately to satisfy Slack's 3s requirement
  logger.info("slack.event.ack", { path: "/api/slack/events" });
  res.json({ ok: true });

  // Process asynchronously after ack
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
    try {
      logger.info("slack.event.message", { path: "/api/slack/events", user: ev.user, channel: ev.channel });
      await handleListenerEvent(event as any);
    } catch (e: any) {
      logger.error("slack.event.error", { message: e?.message });
      // swallow errors; already acked
    }

    // Optional delayed unanswered nudge
    const delayMs = parseInt(process.env.SLACK_UNANSWERED_DELAY_MS || "0");
    if (ev.channel && ev.ts && delayMs > 0) {
      logger.info("slack.unanswered.schedule", { path: "/api/slack/events", inMs: delayMs, channel: ev.channel });
      setTimeout(async () => {
        try {
          const count = await getThreadReplyCount(ev.channel, ev.ts);
          if (count <= 1) {
            await sendSlackNudge({ channel: ev.channel, message: "Need a hand? I can help clarify or route your question." });
          }
        } catch (e: any) {
          logger.warn("slack.unanswered.check_failed", { message: e?.message });
        }
      }, delayMs);
    }
  } else {
    logger.debug?.("slack.event.ignored", { path: "/api/slack/events", reason: ev?.bot_id ? "bot" : ev?.subtype ? `subtype:${ev.subtype}` : "non-message" });
  }
});

export default router
