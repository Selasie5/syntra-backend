import { WebClient } from "@slack/web-api";

const slackToken = process.env.SLACK_BOT_TOKEN;
let client: WebClient | null = null;
if (slackToken) client = new WebClient(slackToken);

export const sendSlackNudge = async ({ user, message }: { user?: string, message: string }) => {
  if (!user) {
    console.warn("[Slack] No user provided for nudge");
    return;
  }
  if (!client) {
    console.log(`[Slack Nudge][dry-run] @${user}: ${message}`);
    return;
  }
  try {
    await client.chat.postMessage({
      channel: user.startsWith("U") ? user : `@${user}`,
      text: message,
    });
    console.log(`[Slack Nudge][sent] -> ${user}`);
  } catch (e) {
    console.error("[Slack] Failed to send nudge", e);
  }
};
