"use client";

import { useCallback, useEffect, useRef } from "react";
import type { WsClientEvent, WsServerEvent } from "@hien-nha/shared";
import { getAccessToken } from "@/lib/api-client";
import { getWsUrl } from "@/lib/chat-api";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useE2EStore } from "@/stores/e2e-store";
import { dispatchCallServerEvent } from "@/lib/call-signaling-bridge";
import { notifyIncomingMessage } from "@/lib/in-app-notifications";

const MAX_BACKOFF = 30000;

export function useWebSocket() {
  const userId = useAuthStore((s) => s.user?.id);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isInitialized || !userId) return;

    let closed = false;

    const connect = () => {
      if (closed) return;
      const token = getAccessToken();
      if (!token) return;

      const ws = new WebSocket(getWsUrl(token));
      wsRef.current = ws;

      ws.onopen = () => {
        backoffRef.current = 1000;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string) as WsServerEvent;
          handleEvent(data);
        } catch {
          // ignore
        }
      };

      ws.onclose = () => {
        wsRef.current = null;
        if (closed) return;
        reconnectTimer.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 2, MAX_BACKOFF);
          connect();
        }, backoffRef.current);
      };
    };

    const handleEvent = (data: WsServerEvent) => {
      const {
        addMessage,
        updateMessage,
        removeMessage,
        setTyping,
        setPresence,
        setOtherRead,
        setOtherOnline,
        upsertConversation,
        addReaction,
        removeReaction,
        conversations,
      } = useChatStore.getState();
      const setPendingE2E = useE2EStore.getState().setPendingRequest;

      switch (data.type) {
        case "message:new": {
          addMessage(data.message);
          const { activeConversationId } = useChatStore.getState();
          const conv = conversations.find(
            (c) => c.id === data.message.conversationId,
          );
          notifyIncomingMessage({
            message: data.message,
            conversationName: conv?.displayName,
            currentUserId: userId,
            activeConversationId,
          });
          break;
        }
        case "message:edit":
          updateMessage(data.message);
          break;
        case "message:delete":
          removeMessage(data.conversationId, data.messageId);
          break;
        case "typing:start":
          setTyping(data.conversationId, data.userId, true);
          break;
        case "typing:stop":
          setTyping(data.conversationId, data.userId, false);
          break;
        case "presence:update":
          setPresence(data.userId, data.status, data.lastSeen);
          for (const c of conversations) {
            if (c.otherUserId === data.userId) {
              setOtherOnline(c.id, data.status === "online");
            }
          }
          break;
        case "read:update":
          setOtherRead(data.conversationId, data.messageId);
          break;
        case "reaction:add":
          addReaction(data.conversationId, data.messageId, data.reaction);
          break;
        case "reaction:remove":
          removeReaction(
            data.conversationId,
            data.messageId,
            data.userId,
            data.emoji,
          );
          break;
        case "conversation:update":
          upsertConversation(data.conversation);
          break;
        case "e2e:request":
          setPendingE2E({
            conversationId: data.conversationId,
            requesterId: data.requesterId,
            requesterName: data.requesterName,
          });
          break;
        case "e2e:enabled":
        case "e2e:disabled":
          break;
        default:
          dispatchCallServerEvent(data);
          break;
      }
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      const ws = wsRef.current;
      if (ws) {
        ws.onclose = null;
        ws.onopen = null;
        ws.onmessage = null;
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
        } else {
          ws.close();
        }
        wsRef.current = null;
      }
    };
  }, [userId, isInitialized]);

  const send = useCallback((event: WsClientEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }, []);

  return { send };
}
