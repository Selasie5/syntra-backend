import { ChaosSignal } from "./detectionAgent";
import { sendSlackNudge } from "../integrations/slack";
import { addNotionComment } from "../integrations/notion";
import { logResolution } from "../utils/chaosFeed";
import { ChatOpenAI } from "@langchain/openai";

const llm = process.env.OPENAI_API_KEY ? new ChatOpenAI({ model: process.env.CHAOS_MODEL || "gpt-4o-mini" }) : null;

async function answerQuestion(question: string): Promise<string> {
  if (!llm) return "I noticed your question. A teammate will follow up shortly.";
  const prompt = `Provide a concise, helpful answer to the following engineering question. If not enough context, state assumptions briefly.\nQuestion: ${question}`;
  try {
    const res: any = await llm.invoke(prompt as any);
    return String(res?.content || "I don't have enough context to answer right now.");
  } catch {
    return "I'm unable to generate an answer right now.";
  }
}

export const handleResolution = async (signal: ChaosSignal) => {
  switch (signal.type) {
    case "unanswered_question":
      {
        const q = signal.metadata?.originalText || signal.metadata?.text || "";
        const answer = await answerQuestion(q);
        await sendSlackNudge({
          user: signal.metadata?.user,
          channel: signal.metadata?.channel,
          message: `Q: ${q}\nA: ${answer}`,
        });
        logResolution(`Answered question for ${signal.metadata?.user}`);
      }
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
