"use client";

import { createContext, useContext } from "react";
import type { WsClientEvent } from "@hien-nha/shared";
import { useWebSocket } from "@/hooks/useWebSocket";

type WsSend = (event: WsClientEvent) => void;

const WsContext = createContext<WsSend | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { send } = useWebSocket();
  return <WsContext.Provider value={send}>{children}</WsContext.Provider>;
}

export function useWsSend(): WsSend {
  const send = useContext(WsContext);
  if (!send) {
    throw new Error("useWsSend must be used within WebSocketProvider");
  }
  return send;
}
