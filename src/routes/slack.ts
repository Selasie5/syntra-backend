import { Router } from "express";
import { handleListenerEvent } from "../agents/listenerAgent";

const router = Router();


router.post("/", async (req, res) => {
  const { user, text, channel } = req.body;

  const event = {
    source: "slack" as const,
    type: "message" as const,
    payload: { user, text, channel },
  };

  await handleListenerEvent(event);
  res.json({ ok: true });
});

export default router
