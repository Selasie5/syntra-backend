import { Router } from "express";
import { handleListenerEvent } from "../agents/listenerAgent";

const router = Router();

router.post("/", async (req, res) => {
  const { user, text, title, event_type, task_id } = req.body;
  const payloadTitle = title || text;
  const event = {
    source: "jira" as const,
    type: (event_type || "task_created"),
    payload: { user, text: payloadTitle, title: payloadTitle, taskId: task_id },
  };
  await handleListenerEvent(event);
  res.json({ ok: true });
});

export default router;
