import { WebClient } from "@slack/web-api";

const slackToken = process.env.SLACK_BOT_TOKEN;
const defaultChannel = process.env.SLACK_DEFAULT_CHANNEL; // e.g., C123...
let client: WebClient | null = null;
if (slackToken) client = new WebClient(slackToken);

type NudgeParams = { user?: string; channel?: string; message: string };

function isChannelId(id?: string) {
  return !!id && /^(C|G|D)/.test(id);
}

function isUserId(id?: string) {
  return !!id && /^U/.test(id);
}

export const sendSlackNudge = async ({ user, channel, message }: NudgeParams) => {
  if (!client) {
    console.log(`[Slack Nudge][dry-run] ${channel ? channel : user ? `to ${user}` : "(no target)"}: ${message}`);
    return;
  }

  let targetChannel = channel;

  try {
    // Prefer explicit channel ID if provided
    if (isChannelId(targetChannel)) {
      // ok as-is
    } else if (isUserId(user)) {
      // Open DM channel with the user
      const open = await client.conversations.open({ users: user! });
      targetChannel = open.channel?.id ?? undefined;
    } else if (defaultChannel && isChannelId(defaultChannel)) {
      targetChannel = defaultChannel;
    }

    if (!targetChannel) {
      console.warn("[Slack] No valid target channel or user provided (need C/G/D or U id). Set SLACK_DEFAULT_CHANNEL for fallback.");
      console.log(`[Slack Nudge][dry-run] message: ${message}`);
      return;
    }

    await client.chat.postMessage({ channel: targetChannel, text: message });
    console.log(`[Slack Nudge][sent] -> ${targetChannel}`);
  } catch (e) {
    console.error("[Slack] Failed to send nudge", e);
  }
};
