import type { CallOutcome, WsClientEvent } from "@hien-nha/shared";
import { db } from "../db/index.js";
import { conversations, users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import {
  getConversationMemberIds,
  isConversationMember,
} from "../services/conversations.js";
import { createCallLogMessage } from "../services/call-log.js";
import { notifyIncomingCall } from "../services/push.js";
import { wsHub } from "./hub.js";
import {
  type CallSession,
  endCall,
  endCallsForUser,
  getCallDurationSec,
  getCallSession,
  isUserInCall,
  markCallActive,
  startRinging,
} from "./call-state.js";

function resolveCallLog(
  session: CallSession | undefined,
): { outcome: CallOutcome; durationSec: number | null } {
  if (!session) {
    return { outcome: "completed", durationSec: null };
  }
  if (session.state === "active") {
    return {
      outcome: "completed",
      durationSec: getCallDurationSec(session),
    };
  }
  return { outcome: "missed", durationSec: null };
}

async function logCallEnd(
  conversationId: string,
  callerId: string,
  session: CallSession | undefined,
  outcomeOverride?: CallOutcome,
): Promise<void> {
  const { outcome, durationSec } = resolveCallLog(session);
  try {
    await createCallLogMessage({
      conversationId,
      callerId,
      outcome: outcomeOverride ?? outcome,
      durationSec,
    });
  } catch (err) {
    console.error("Failed to create call log message:", err);
  }
}

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
        void logCallEnd(event.conversationId, userId, undefined, "busy");
        return;
      }

      const existing = getCallSession(event.conversationId);
      if (existing) {
        wsHub.sendToUser(userId, {
          type: "call:busy",
          conversationId: event.conversationId,
        });
        void logCallEnd(event.conversationId, userId, undefined, "busy");
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
      void notifyIncomingCall(peerId, event.conversationId, callerName);
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

      const sessionSnapshot = { ...session };
      endCall(event.conversationId);
      void logCallEnd(
        event.conversationId,
        sessionSnapshot.callerId,
        sessionSnapshot,
        "rejected",
      );
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
        const sessionSnapshot = { ...session };
        endCall(event.conversationId);
        void logCallEnd(
          event.conversationId,
          sessionSnapshot.callerId,
          sessionSnapshot,
        );
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
  const endedSessions = endCallsForUser(userId);
  for (const session of endedSessions) {
    void logCallEnd(
      session.conversationId,
      session.callerId,
      session,
    );
    void getConversationMemberIds(session.conversationId).then((memberIds) => {
      for (const id of memberIds) {
        if (id !== userId) {
          wsHub.sendToUser(id, {
            type: "call:ended",
            conversationId: session.conversationId,
            userId,
            reason: "disconnect",
          });
        }
      }
    });
  }
}
