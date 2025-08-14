import { ChaosSignal } from "./detectionAgent";
import { sendSlackNudge } from "../integrations/slack";
import { addNotionComment } from "../integrations/notion";
import { logResolution } from "../utils/chaosFeed";

export const handleResolution = async (signal: ChaosSignal) => {
  switch (signal.type) {
    case "unanswered_question":
      await sendSlackNudge({
        user: signal.metadata?.user,
        channel: signal.metadata?.channel,
        message: `👋 Just a heads-up: Your question might need a follow-up.\n"${signal.metadata?.text}"`,
      });
  logResolution(`Sent slack nudge to ${signal.metadata?.user}`);
      break;

    case "blocked_task":
  await addNotionComment({
        taskId: signal.metadata?.taskId,
        comment: `Detected this task is blocked. Consider assigning a helper or updating the status.`,
      });
  logResolution(`Added notion comment to task ${signal.metadata?.taskId}`);
      break;

    case "possible_duplication":
  console.log(`[Resolver] Duplicate detected — no action yet.`);
      break;

    default:
      console.log(`[Resolver] No resolution rule for ${signal.type}`);
  }
};
