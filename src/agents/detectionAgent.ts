import { logChaosSignal } from "../utils/chaosFeed";
import { ChatOpenAI } from "@langchain/openai";

let llm: ChatOpenAI | null = null;
function ensureLLM(): ChatOpenAI | null {
  if (!llm && process.env.OPENAI_API_KEY) {
    llm = new ChatOpenAI({ model: process.env.CHAOS_MODEL || "gpt-4o-mini" });
  }
  return llm;
}

async function classifyTone(text: string): Promise<string | null> {
  if (!llm) return null;
  const model = ensureLLM();
  if (!model) return null;
  try {
    const prompt = `Classify if the following message indicates confusion/uncertainty. Reply with CONFUSED or CLEAR. Message: ${text}`;
    const res = await model.invoke(prompt as any);
    const content = (res as any).content?.toString().toUpperCase() || "";
    return content.includes("CONFUSED") ? "confused" : "clear";
  } catch {
    return null;
  }
}

export type ChaosSignal= {
   type: "unanswered_question" | "possible_duplication" | "blocked_task" | "confused_tone";
  source: string;
  summary: string;
  metadata?: Record<string, any>;
}

export interface RawEvent {
  source: string;
  type: string;
  payload: Record<string, any>;
}

export const handleDetection = async (event: RawEvent):Promise<ChaosSignal[]> => {
  const signals: ChaosSignal[] = [];
  if(event.source === "slack" && event.type === "message")
  {
  const text = event.payload.text?.toLowerCase() || "";

    if(text.includes("?")&& !text.includes("thank you") && !text.includes("fyi"))
    {
     signals.push({
        type: "unanswered_question",
        source: "slack",
        summary: `Potential question from ${event.payload.user}: "${text}"`,
  metadata: { user: event.payload.user, text, originalText: event.payload.text, channel: event.payload.channel },
      });
      logChaosSignal(signals[signals.length - 1]);
    }
    // LLM tone classification
    if (text && llm) {
      const tone = await classifyTone(text);
      if (tone === "confused") {
        signals.push({
          type: "confused_tone",
          source: "slack",
          summary: `Confused tone detected in message: "${event.payload.text}"`,
          metadata: { user: event.payload.user, text: event.payload.text },
        });
        logChaosSignal(signals[signals.length - 1]);
      }
    }
  }
  if (event.source === "notion" && event.payload.status === "Blocked") {
    signals.push({
      type: "blocked_task",
      source: "notion",
      summary: `Task ${event.payload.taskId} is marked as Blocked`,
      metadata: { ...event.payload },
    });
     logChaosSignal(signals[signals.length - 1]);
  }

  if (event.source === "jira" && event.type === "task_created") {
    const titleOrText = (event.payload.title || event.payload.text || "").toLowerCase();
    if (titleOrText.includes("login")) {
      signals.push({
        type: "possible_duplication",
        source: "jira",
        summary: `Another task mentioning "login" was just created.`,
        metadata: { ...event.payload },
      });
       logChaosSignal(signals[signals.length - 1]);
    }
  }
  console.log(`[Detector] Signals found:`, signals);
  return signals;
};
