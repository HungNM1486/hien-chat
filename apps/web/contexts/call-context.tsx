"use client";

import { createContext, useContext, useEffect } from "react";
import { CallOverlay } from "@/components/chat/call-overlay";
import { useCallManager } from "@/hooks/useCallManager";
import { registerCallServerHandler } from "@/lib/call-signaling-bridge";
import { useWsSend } from "@/contexts/ws-context";

interface CallContextValue {
  startCall: (conversationId: string, peerName: string) => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  hangup: (message?: string) => void;
  toggleMute: () => void;
}

const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const send = useWsSend();
  const manager = useCallManager(send);

  useEffect(() => {
    return registerCallServerHandler(manager.handleServerEvent);
  }, [manager.handleServerEvent]);

  const value: CallContextValue = {
    startCall: manager.startCall,
    acceptCall: manager.acceptCall,
    rejectCall: manager.rejectCall,
    hangup: manager.hangup,
    toggleMute: manager.toggleMute,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
      <CallOverlay
        getEngine={manager.getEngine}
        onAccept={manager.acceptCall}
        onReject={manager.rejectCall}
        onHangup={manager.hangup}
        onToggleMute={manager.toggleMute}
      />
    </CallContext.Provider>
  );
}

export function useCall(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) {
    throw new Error("useCall must be used within CallProvider");
  }
  return ctx;
}
