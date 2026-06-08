import type { WsClientEvent } from "@hien-nha/shared";
import { db } from "../db/index.js";
import { conversations, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import {
  getConversationMemberIds,
  isConversationMember,
} from "../services/conversations.js";
import { wsHub } from "./hub.js";
import {
  endCall,
  endCallsForUser,
  getCallSession,
  isUserInCall,
  markCallActive,
  startRinging,
} from "./call-state.js";

async function getDirectPeerId(
  conversationId: string,
  userId: string,
): Promise<{ peerId: string } | { error: string }> {
  const [conversation] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId))
    .limit(1);

  if (!conversation) return { error: "not_found" };
  if (conversation.type !== "direct") return { error: "not_direct" };

  const memberIds = await getConversationMemberIds(conversationId);
  const peerId = memberIds.find((id) => id !== userId);
  if (!peerId) return { error: "no_peer" };

  return { peerId };
}

async function getUserDisplayName(userId: string): Promise<string> {
  const [user] = await db
    .select({ displayName: users.displayName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user?.displayName ?? "Người dùng";
}

function relayToPeer(
  conversationId: string,
  fromUserId: string,
  peerId: string,
  event: Extract<WsClientEvent, { type: `call:${string}` }>,
): void {
  switch (event.type) {
    case "call:offer":
      wsHub.sendToUser(peerId, {
        type: "call:offer",
        conversationId,
        fromUserId,
        sdp: event.sdp,
      });
      break;
    case "call:answer":
      wsHub.sendToUser(peerId, {
        type: "call:answer",
        conversationId,
        fromUserId,
        sdp: event.sdp,
      });
      break;
    case "call:ice":
      wsHub.sendToUser(peerId, {
        type: "call:ice",
        conversationId,
        fromUserId,
        candidate: event.candidate,
      });
      break;
    default:
      break;
  }
}

export async function handleCallEvent(
  userId: string,
  event: Extract<WsClientEvent, { type: `call:${string}` }>,
): Promise<void> {
  const allowed = await isConversationMember(event.conversationId, userId);
  if (!allowed) return;

  const peerResult = await getDirectPeerId(event.conversationId, userId);
  if ("error" in peerResult) return;
  const { peerId } = peerResult;

  switch (event.type) {
    case "call:invite": {
      if (isUserInCall(userId) || isUserInCall(peerId)) {
        wsHub.sendToUser(userId, {
          type: "call:busy",
          conversationId: event.conversationId,
        });
        return;
      }

      const existing = getCallSession(event.conversationId);
      if (existing) {
        wsHub.sendToUser(userId, {
          type: "call:busy",
          conversationId: event.conversationId,
        });
        return;
      }

      startRinging(event.conversationId, userId, peerId);
      const callerName = await getUserDisplayName(userId);
      wsHub.sendToUser(peerId, {
        type: "call:incoming",
        conversationId: event.conversationId,
        callerId: userId,
        callerName,
      });
      break;
    }

    case "call:accept": {
      const session = getCallSession(event.conversationId);
      if (!session || session.calleeId !== userId) return;

      markCallActive(event.conversationId);
      wsHub.sendToUser(session.callerId, {
        type: "call:accepted",
        conversationId: event.conversationId,
        calleeId: userId,
      });
      break;
    }

    case "call:reject": {
      const session = getCallSession(event.conversationId);
      if (!session) return;
      if (session.calleeId !== userId && session.callerId !== userId) return;

      endCall(event.conversationId);
      const otherId = session.callerId === userId ? session.calleeId : session.callerId;
      wsHub.sendToUser(otherId, {
        type: "call:rejected",
        conversationId: event.conversationId,
        userId,
      });
      break;
    }

    case "call:hangup": {
      const session = getCallSession(event.conversationId);
      if (session) {
        endCall(event.conversationId);
        const otherId =
          session.callerId === userId ? session.calleeId : session.callerId;
        wsHub.sendToUser(otherId, {
          type: "call:ended",
          conversationId: event.conversationId,
          userId,
          reason: "hangup",
        });
      } else {
        wsHub.sendToUser(peerId, {
          type: "call:ended",
          conversationId: event.conversationId,
          userId,
          reason: "hangup",
        });
      }
      break;
    }

    case "call:offer":
    case "call:answer":
    case "call:ice":
      relayToPeer(event.conversationId, userId, peerId, event);
      if (event.type === "call:answer") {
        markCallActive(event.conversationId);
      }
      break;
  }
}

export function cleanupCallsOnDisconnect(userId: string): void {
  const endedIds = endCallsForUser(userId);
  for (const conversationId of endedIds) {
    void getConversationMemberIds(conversationId).then((memberIds) => {
      for (const id of memberIds) {
        if (id !== userId) {
          wsHub.sendToUser(id, {
            type: "call:ended",
            conversationId,
            userId,
            reason: "disconnect",
          });
        }
      }
    });
  }
}
