import { WebClient } from "@slack/web-api";

let client: WebClient | null = null;
let defaultChannel: string | undefined = undefined;

function ensureClient() {
  if (!client) {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) return null;
    client = new WebClient(token);
  }
  if (!defaultChannel) {
    defaultChannel = process.env.SLACK_DEFAULT_CHANNEL;
  }
  return client;
}

type NudgeParams = { user?: string; channel?: string; message: string };

function isChannelId(id?: string) {
  return !!id && /^(C|G|D)/.test(id);
}

function isUserId(id?: string) {
  return !!id && /^U/.test(id);
}

export const sendSlackNudge = async ({ user, channel, message }: NudgeParams) => {
  if (!ensureClient()) {
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
  const open = await client!.conversations.open({ users: user! });
      targetChannel = open.channel?.id ?? undefined;
    } else if (defaultChannel && isChannelId(defaultChannel)) {
      targetChannel = defaultChannel;
    }

    if (!targetChannel) {
      console.warn("[Slack] No valid target channel or user provided (need C/G/D or U id). Set SLACK_DEFAULT_CHANNEL for fallback.");
      console.log(`[Slack Nudge][dry-run] message: ${message}`);
      return;
    }

  await client!.chat.postMessage({ channel: targetChannel, text: message });
    console.log(`[Slack Nudge][sent] -> ${targetChannel}`);
  } catch (e: any) {
    const data = e?.data || {};
    console.error("[Slack] Failed to send nudge", { error: e?.message, code: data?.error, response: data });
  }
};
