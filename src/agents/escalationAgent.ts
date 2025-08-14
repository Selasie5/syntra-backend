import { logResolution } from "../utils/chaosFeed";

export const handleEscalation = async (issue: any) => {
  console.log("[Escalation Agent] Escalating:", issue);
  logResolution(`Escalated issue for signal ${issue?.signal?.type}`);
  // Future: integrate PagerDuty / email / Slack channel alert
};
