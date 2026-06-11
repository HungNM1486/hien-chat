import type { CallOutcome, MessagePublic } from "@hien-nha/shared";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { messages, users } from "../db/schema.js";
import { wsHub } from "../ws/hub.js";
import { getConversationMemberIds } from "./conversations.js";
import { enrichSingleMessage } from "./messages.js";

export async function createCallLogMessage(params: {
  conversationId: string;
  callerId: string;
  outcome: CallOutcome;
  durationSec: number | null;
}): Promise<MessagePublic> {
  const content = JSON.stringify({
    outcome: params.outcome,
    durationSec: params.durationSec,
    callerId: params.callerId,
  });

  const [message] = await db
    .insert(messages)
    .values({
      conversationId: params.conversationId,
      senderId: params.callerId,
      content,
      contentType: "call",
      encrypted: false,
    })
    .returning();

  const [sender] = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, params.callerId))
    .limit(1);

  const messagePublic = await enrichSingleMessage(message, sender);

  const memberIds = await getConversationMemberIds(params.conversationId);
  for (const memberId of memberIds) {
    wsHub.sendToUser(memberId, {
      type: "message:new",
      message: messagePublic,
    });
  }

  return messagePublic;
}
