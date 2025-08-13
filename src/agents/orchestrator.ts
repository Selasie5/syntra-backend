import { handleDetection } from "./detectionAgent";
import { handleResolution } from "./resolverAgent";
import { handleEscalation } from "./escalationAgent";
import { IngestedEvent } from "../types/agent";
import { logger } from "../utils/logger";

async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 300): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw lastErr;
}
export const processIngestedEvent = async (event: IngestedEvent) => {
  const signals = await handleDetection(event as any);
  for (const signal of signals) {
    try {
      await withRetry(() => handleResolution(signal));
    } catch (e) {
      logger.error("Resolution failed, escalating", { error: (e as Error).message, signal });
      await handleEscalation({ signal, error: (e as Error).message });
    }
  }
};
