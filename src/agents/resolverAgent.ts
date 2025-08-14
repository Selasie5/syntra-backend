import { ChaosSignal } from "./detectionAgent";
import { sendSlackNudge } from "../integrations/slack";
import { addNotionComment } from "../integrations/notion";
import { logResolution } from "../utils/chaosFeed";
import { ChatOpenAI } from "@langchain/openai";
import { retrieveMemory } from "./memoryAgent";

let llm: ChatOpenAI | null = null;
function ensureLLM(): ChatOpenAI | null {
  // Lazy init to ensure dotenv has loaded
  if (!llm && process.env.OPENAI_API_KEY) {
    llm = new ChatOpenAI({ model: process.env.CHAOS_MODEL || "gpt-4o-mini" });
  }
  return llm;
}

async function getMemoryContext(query: string): Promise<string> {
  try {
    const results: any = await retrieveMemory(query);
    const docs: string[] = (results?.documents || []).flat();
    const top = docs.slice(0, 5).filter(Boolean);
    if (!top.length) return "";
    return top.map((d, i) => `(${i + 1}) ${d}`).join("\n");
  } catch {
    return "";
  }
}

async function answerQuestion(question: string): Promise<string> {
  const context = await getMemoryContext(question);
  const model = ensureLLM();
  if (!model) return "I noticed your question. A teammate will follow up shortly.";
  const messages: any = [
    {
      role: "system",
     content: [
  "You are Syntra's engineering assistant, designed to proactively detect, resolve, and prevent communication gaps, task duplication, and dropped action items across connected platforms.",
  "- Always start with a concise, high-impact answer or solution.",
  "- Pull in and act on relevant context from recent interactions, tasks, or project history.",
  "- Where possible, take initiative to draft or execute the next step (e.g., message, update, task assignment) rather than just suggesting it.",
  "- If information is missing or ambiguous, ask up to 2 short, targeted clarifying follow-up questions.",
  "- Format instructions or solutions in clear bullet points for fast scanning.",
  "- Maintain the user's voice and style when drafting messages or responses so it feels human and consistent.",
  "- Do not include prefixes like 'Q:' or 'A:'—just write the answer, then a 'Follow-ups:' list if needed."
].join("\n"),
    },
  ];
  if (context) {
    messages.push({ role: "system", content: `Context:\n${context}` });
  }
  messages.push({ role: "user", content: question });

  try {
    const res: any = await model.invoke(messages);
    const text = String(res?.content || "").trim();
    return text || "I don't have enough context to answer right now.";
  } catch {
    return "I'm unable to generate an answer right now.";
  }
}

export const handleResolution = async (signal: ChaosSignal) => {
  switch (signal.type) {
    case "unanswered_question": {
      const q = signal.metadata?.originalText || signal.metadata?.text || "";
      const answer = await answerQuestion(q);
      await sendSlackNudge({
        user: signal.metadata?.user,
        channel: signal.metadata?.channel,
        message: answer,
      });
      logResolution(`Answered question for ${signal.metadata?.user}`);
      break;
    }

    case "confused_tone": {
      const q = signal.metadata?.originalText || signal.metadata?.text || "";
      const answer = await answerQuestion(q);
      await sendSlackNudge({
        user: signal.metadata?.user,
        channel: signal.metadata?.channel,
        message: answer,
      });
      logResolution(`Answered confused tone for ${signal.metadata?.user}`);
      break;
    }

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
