import type { FastifyInstance } from "fastify";
import websocket from "@fastify/websocket";
import type { WsClientEvent } from "@hien-nha/shared";
import { verifyAccessToken } from "../lib/auth.js";
import {
  getConversationMemberIds,
  isConversationMember,
  markConversationRead,
} from "../services/conversations.js";
import { cleanupCallsOnDisconnect, handleCallEvent } from "./call-handler.js";
import { wsHub } from "./hub.js";

const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

function typingKey(conversationId: string, userId: string): string {
  return `${conversationId}:${userId}`;
}

export async function wsRoutes(app: FastifyInstance) {
  await app.register(websocket);

  app.get("/ws", { websocket: true }, (socket, request) => {
    const token =
      (request.query as { token?: string }).token ??
      request.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      socket.close(4001, "Unauthorized");
      return;
    }

    let userId: string;
    try {
      userId = verifyAccessToken(token).sub;
    } catch {
      socket.close(4001, "Invalid token");
      return;
    }

    wsHub.addConnection(userId, socket);
    wsHub.send(socket, { type: "connected", userId });
    wsHub.broadcastPresence(userId, "online");

    const pingInterval = setInterval(() => {
      wsHub.send(socket, { type: "pong" });
    }, 30000);

    socket.on("message", async (raw) => {
      try {
        const event = JSON.parse(raw.toString()) as WsClientEvent;

        switch (event.type) {
          case "subscribe": {
            const allowed = await isConversationMember(
              event.conversationId,
              userId,
            );
            if (allowed) wsHub.subscribe(socket, event.conversationId);
            break;
          }
          case "unsubscribe":
            wsHub.unsubscribe(socket, event.conversationId);
            break;
          case "typing:start": {
            const allowed = await isConversationMember(
              event.conversationId,
              userId,
            );
            if (!allowed) break;

            wsHub.broadcastToConversation(
              event.conversationId,
              {
                type: "typing:start",
                conversationId: event.conversationId,
                userId,
              },
              userId,
            );

            const key = typingKey(event.conversationId, userId);
            clearTimeout(typingTimers.get(key));
            typingTimers.set(
              key,
              setTimeout(() => {
                wsHub.broadcastToConversation(
                  event.conversationId,
                  {
                    type: "typing:stop",
                    conversationId: event.conversationId,
                    userId,
                  },
                  userId,
                );
                typingTimers.delete(key);
              }, 3000),
            );
            break;
          }
          case "typing:stop":
            wsHub.broadcastToConversation(
              event.conversationId,
              {
                type: "typing:stop",
                conversationId: event.conversationId,
                userId,
              },
              userId,
            );
            break;
          case "message:read": {
            const allowed = await isConversationMember(
              event.conversationId,
              userId,
            );
            if (!allowed) break;

            await markConversationRead(
              event.conversationId,
              userId,
              event.messageId,
            );

            const memberIds = await getConversationMemberIds(
              event.conversationId,
            );
            for (const memberId of memberIds) {
              if (memberId === userId) continue;
              wsHub.sendToUser(memberId, {
                type: "read:update",
                conversationId: event.conversationId,
                userId,
                messageId: event.messageId,
              });
            }
            break;
          }
          case "ping":
            wsHub.send(socket, { type: "pong" });
            break;
          case "call:invite":
          case "call:accept":
          case "call:reject":
          case "call:offer":
          case "call:answer":
          case "call:ice":
          case "call:hangup":
            await handleCallEvent(userId, event);
            break;
        }
      } catch {
        // ignore malformed messages
      }
    });

    socket.on("close", () => {
      clearInterval(pingInterval);
      cleanupCallsOnDisconnect(userId);
      wsHub.removeConnection(socket);
      if (!wsHub.isOnline(userId)) {
        wsHub.broadcastPresence(userId, "offline");
      }
    });
  });
}

export { wsHub };
