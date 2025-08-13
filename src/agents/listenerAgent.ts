import { AgentEvent } from "../types/agent";
import { handleDetection } from "./detectionAgent";
export const handleListenerEvent = async (event: AgentEvent) => {
  console.log(`[Listener] Received ${event.source} event:`, event);
  await handleDetection(event);
};
