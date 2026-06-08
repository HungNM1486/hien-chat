"use client";

import { useEffect, useRef } from "react";
import type { WsClientEvent, WsServerEvent } from "@hien-nha/shared";
import { getAccessToken } from "@/lib/api-client";
import { getWsUrl } from "@/lib/chat-api";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { useE2EStore } from "@/stores/e2e-store";

const MAX_BACKOFF = 30000;

export function useWebSocket() {
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const removeMessage = useChatStore((s) => s.removeMessage);
  const setTyping = useChatStore((s) => s.setTyping);
  const setPresence = useChatStore((s) => s.setPresence);
  const setOtherRead = useChatStore((s) => s.setOtherRead);
  const setOtherOnline = useChatStore((s) => s.setOtherOnline);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const addReaction = useChatStore((s) => s.addReaction);
  const removeReaction = useChatStore((s) => s.removeReaction);
  const setPendingE2E = useE2EStore((s) => s.setPendingRequest);

  useEffect(() => {
    if (!isInitialized || !user) return;

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
      switch (data.type) {
        case "message:new":
          addMessage(data.message);
          break;
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
          for (const c of useChatStore.getState().conversations) {
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
      }
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [
    user,
    isInitialized,
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
    setPendingE2E,
  ]);

  const send = (event: WsClientEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  };

  return { send };
}
