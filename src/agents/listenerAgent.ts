import { AgentEvent } from "../types/agent";

export const handleListenerEvent = async (event: AgentEvent) => {
  console.log("[Listener Agent] Received:", event);
  // Simulate forwarding to detection
};
