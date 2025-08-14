import { Router } from "express";
import { handleListenerEvent } from "../agents/listenerAgent";

const router = Router();

router.post("/", async (req, res) => {
  const { user, taskId, status, action } = req.body;

  const event = {
    source: "notion" as const,
    type: action,
    payload: { user, taskId, status }
  };

  await handleListenerEvent(event);
  res.json({ ok: true });
});

export default router;
