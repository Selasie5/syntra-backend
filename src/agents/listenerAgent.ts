import { AgentEvent } from "../types/agent";
import { handleDetection } from "./detectionAgent";
import { handleResolution } from "./resolverAgent";
export const handleListenerEvent = async (event: AgentEvent) => {
  console.log(`[Listener] Received ${event.source} event:`, event);
  const signals = await handleDetection(event as any);
  for (const s of signals) {
    await handleResolution(s);
  }
};
