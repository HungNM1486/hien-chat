"use client";

import { useEffect, useRef } from "react";
import type { WsClientEvent, WsServerEvent } from "@hien-nha/shared";
import { VoiceCallEngine } from "@/lib/voice-call-engine";
import { useCallStore } from "@/stores/call-store";
import { notifyIncomingCall } from "@/lib/in-app-notifications";
import { useNotificationBannerStore } from "@/stores/notification-banner-store";
import { startCallRing, stopCallRing } from "@/lib/notification-sounds";
import { useNotificationStore } from "@/stores/notification-store";
import { toast } from "@/stores/toast-store";

type WsSend = (event: WsClientEvent) => void;

export function useCallManager(send: WsSend) {
  const engineRef = useRef<VoiceCallEngine | null>(null);
  const stopRingRef = useRef<(() => void) | null>(null);
  const sendRef = useRef(send);
  sendRef.current = send;

  const stopRing = () => {
    stopRingRef.current?.();
    stopRingRef.current = null;
    stopCallRing();
  };

  const dismissCallBanner = () => {
    const banner = useNotificationBannerStore.getState().banner;
    if (banner?.kind === "call") {
      useNotificationBannerStore.getState().dismiss();
    }
  };

  useEffect(() => {
    const engine = new VoiceCallEngine();
    engineRef.current = engine;

    engine.setHandlers({
      onIceCandidate: (candidate) => {
        const { conversationId, status } = useCallStore.getState();
        if (!conversationId || status === "idle" || status === "ended") return;
        sendRef.current({
          type: "call:ice",
          conversationId,
          candidate,
        });
      },
      onRemoteStream: () => {
        useCallStore.getState().setRemoteAudioReady(true);
        useCallStore.getState().setActive();
      },
      onConnectionState: (state) => {
        if (state === "failed" || state === "disconnected") {
          const { conversationId, status } = useCallStore.getState();
          if (conversationId && status !== "idle" && status !== "ended") {
            hangup("Cuộc gọi bị gián đoạn");
          }
        }
      },
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  const hangup = (message?: string) => {
    stopRing();
    dismissCallBanner();
    const { conversationId, status } = useCallStore.getState();
    if (conversationId && status !== "idle" && status !== "ended") {
      sendRef.current({ type: "call:hangup", conversationId });
    }
    engineRef.current?.destroy();
    engineRef.current = new VoiceCallEngine();
    engineRef.current.setHandlers({
      onIceCandidate: (candidate) => {
        const state = useCallStore.getState();
        if (!state.conversationId || state.status === "idle") return;
        sendRef.current({
          type: "call:ice",
          conversationId: state.conversationId,
          candidate,
        });
      },
      onRemoteStream: () => {
        useCallStore.getState().setRemoteAudioReady(true);
        useCallStore.getState().setActive();
      },
      onConnectionState: (state) => {
        if (state === "failed" || state === "disconnected") {
          hangup("Cuộc gọi bị gián đoạn");
        }
      },
    });
    useCallStore.getState().setEnded(message);
    setTimeout(() => useCallStore.getState().reset(), 2000);
  };

  const startCall = (conversationId: string, peerName: string) => {
    const { status } = useCallStore.getState();
    if (status !== "idle" && status !== "ended") return;

    useCallStore.getState().reset();
    useCallStore.getState().setOutgoing(conversationId, peerName);
    sendRef.current({ type: "call:invite", conversationId });
  };

  const acceptCall = async () => {
    const { conversationId, status } = useCallStore.getState();
    if (!conversationId || status !== "incoming") return;

    stopRing();
    dismissCallBanner();
    try {
      useCallStore.getState().setConnecting();
      await engineRef.current?.prepare();
      sendRef.current({ type: "call:accept", conversationId });
    } catch {
      toast("Cần quyền micro để nghe gọi", "error");
      rejectCall();
    }
  };

  const rejectCall = () => {
    const { conversationId, status } = useCallStore.getState();
    if (!conversationId || status !== "incoming") return;
    stopRing();
    dismissCallBanner();
    sendRef.current({ type: "call:reject", conversationId });
    engineRef.current?.destroy();
    useCallStore.getState().reset();
  };

  const toggleMute = () => {
    const { isMuted } = useCallStore.getState();
    const next = !isMuted;
    engineRef.current?.setMuted(next);
    useCallStore.getState().setMuted(next);
  };

  const handleServerEvent = async (data: WsServerEvent) => {
    const engine = engineRef.current;
    if (!engine) return;

    switch (data.type) {
      case "call:incoming":
        if (useCallStore.getState().status !== "idle") {
          sendRef.current({
            type: "call:reject",
            conversationId: data.conversationId,
          });
          return;
        }
        useCallStore
          .getState()
          .setIncoming(data.conversationId, data.callerId, data.callerName);
        notifyIncomingCall(data.callerName, data.conversationId);
        if (useNotificationStore.getState().callRing) {
          stopRing();
          stopRingRef.current = startCallRing();
        }
        break;

      case "call:accepted":
        if (useCallStore.getState().conversationId !== data.conversationId) return;
        try {
          useCallStore.getState().setConnecting();
          await engine.prepare();
          const offer = await engine.createOffer();
          sendRef.current({
            type: "call:offer",
            conversationId: data.conversationId,
            sdp: offer,
          });
        } catch {
          hangup("Không thể bắt đầu cuộc gọi");
          toast("Cần quyền micro để gọi", "error");
        }
        break;

      case "call:offer":
        if (useCallStore.getState().conversationId !== data.conversationId) return;
        try {
          if (useCallStore.getState().status === "incoming") {
            useCallStore.getState().setConnecting();
          }
          if (!engine.getLocalStream()) await engine.prepare();
          const answer = await engine.handleOffer(data.sdp);
          sendRef.current({
            type: "call:answer",
            conversationId: data.conversationId,
            sdp: answer,
          });
        } catch {
          hangup("Không thể kết nối cuộc gọi");
        }
        break;

      case "call:answer":
        if (useCallStore.getState().conversationId !== data.conversationId) return;
        try {
          await engine.handleAnswer(data.sdp);
        } catch {
          hangup("Không thể kết nối cuộc gọi");
        }
        break;

      case "call:ice":
        if (useCallStore.getState().conversationId !== data.conversationId) return;
        await engine.addIceCandidate(data.candidate);
        break;

      case "call:rejected":
        if (useCallStore.getState().conversationId !== data.conversationId) return;
        hangup("Đã từ chối cuộc gọi");
        break;

      case "call:busy":
        if (useCallStore.getState().conversationId !== data.conversationId) return;
        hangup("Người nhận đang bận");
        toast("Người nhận đang bận", "info");
        break;

      case "call:ended":
        if (useCallStore.getState().conversationId !== data.conversationId) return;
        hangup(
          data.reason === "disconnect"
            ? "Cuộc gọi đã kết thúc"
            : undefined,
        );
        break;
    }
  };

  const handleServerEventRef = useRef(handleServerEvent);
  handleServerEventRef.current = handleServerEvent;

  return {
    startCall,
    acceptCall,
    rejectCall,
    hangup,
    toggleMute,
    handleServerEvent: (e: WsServerEvent) => handleServerEventRef.current(e),
    getEngine: () => engineRef.current,
  };
}

export type CallManager = ReturnType<typeof useCallManager>;
