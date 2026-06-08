import { create } from "zustand";

export type CallStatus =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connecting"
  | "active"
  | "ended";

interface CallState {
  status: CallStatus;
  conversationId: string | null;
  peerId: string | null;
  peerName: string | null;
  isCaller: boolean;
  isMuted: boolean;
  startedAt: number | null;
  endMessage: string | null;
  remoteAudioReady: boolean;

  reset: () => void;
  setOutgoing: (conversationId: string, peerName: string) => void;
  setIncoming: (
    conversationId: string,
    callerId: string,
    callerName: string,
  ) => void;
  setConnecting: () => void;
  setActive: () => void;
  setEnded: (message?: string) => void;
  setMuted: (muted: boolean) => void;
  setRemoteAudioReady: (ready: boolean) => void;
}

const initial = {
  status: "idle" as CallStatus,
  conversationId: null as string | null,
  peerId: null as string | null,
  peerName: null as string | null,
  isCaller: false,
  isMuted: false,
  startedAt: null as number | null,
  endMessage: null as string | null,
  remoteAudioReady: false,
};

export const useCallStore = create<CallState>((set) => ({
  ...initial,

  reset: () => set({ ...initial }),

  setOutgoing: (conversationId, peerName) =>
    set({
      status: "outgoing",
      conversationId,
      peerName,
      isCaller: true,
      isMuted: false,
      startedAt: null,
      endMessage: null,
      remoteAudioReady: false,
    }),

  setIncoming: (conversationId, callerId, callerName) =>
    set({
      status: "incoming",
      conversationId,
      peerId: callerId,
      peerName: callerName,
      isCaller: false,
      isMuted: false,
      startedAt: null,
      endMessage: null,
      remoteAudioReady: false,
    }),

  setConnecting: () => set({ status: "connecting" }),

  setActive: () =>
    set({
      status: "active",
      startedAt: Date.now(),
      endMessage: null,
    }),

  setEnded: (message) =>
    set({
      status: "ended",
      endMessage: message ?? null,
      remoteAudioReady: false,
    }),

  setMuted: (muted) => set({ isMuted: muted }),

  setRemoteAudioReady: (ready) => set({ remoteAudioReady: ready }),
}));
