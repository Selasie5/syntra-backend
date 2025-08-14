import { Client as NotionClient } from "@notionhq/client";

const notionToken = process.env.NOTION_API_KEY;
let notion: NotionClient | null = null;
if (notionToken) notion = new NotionClient({ auth: notionToken });

export const addNotionComment = async ({ taskId, comment }: { taskId?: string, comment: string }) => {
  if (!taskId) {
    console.warn("[Notion] No taskId provided for comment");
    return;
  }
  if (!notion) {
    console.log(`[Notion Comment][dry-run] on task ${taskId}: ${comment}`);
    return;
  }
  try {
    await notion.comments.create({
      parent: { page_id: taskId },
      rich_text: [{ type: "text", text: { content: comment } }],
    });
    console.log(`[Notion Comment][sent] ${taskId}`);
  } catch (e) {
    console.error("[Notion] Failed to add comment", e);
  }
};
