"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  MicrophoneIcon,
  MicrophoneSlashIcon,
  PhoneDisconnectIcon,
  PhoneIcon,
  UserIcon,
} from "@phosphor-icons/react";
import type { VoiceCallEngine } from "@/lib/voice-call-engine";
import { useCallStore } from "@/stores/call-store";
import { cn } from "@/lib/utils";

interface CallOverlayProps {
  getEngine: () => VoiceCallEngine | null;
  onAccept: () => Promise<void>;
  onReject: () => void;
  onHangup: (message?: string) => void;
  onToggleMute: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CallOverlay({
  getEngine,
  onAccept,
  onReject,
  onHangup,
  onToggleMute,
}: CallOverlayProps) {
  const status = useCallStore((s) => s.status);
  const peerName = useCallStore((s) => s.peerName);
  const isMuted = useCallStore((s) => s.isMuted);
  const startedAt = useCallStore((s) => s.startedAt);
  const endMessage = useCallStore((s) => s.endMessage);
  const remoteAudioReady = useCallStore((s) => s.remoteAudioReady);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const engine = getEngine();
    const stream = engine?.getRemoteStream();
    const el = remoteAudioRef.current;
    if (el && stream) {
      el.srcObject = stream;
      void el.play().catch(() => {});
    }
  }, [getEngine, remoteAudioReady, status]);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (status === "idle") return null;

  const statusLabel =
    status === "outgoing"
      ? "Đang gọi..."
      : status === "incoming"
        ? "Cuộc gọi đến"
        : status === "connecting"
          ? "Đang kết nối..."
          : status === "active"
            ? "Đang gọi"
            : endMessage ?? "Cuộc gọi đã kết thúc";

  const overlay = (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm">
      <div
        className={cn(
          "w-full max-w-sm rounded-3xl border border-border/60 bg-surface p-6 shadow-[0_24px_64px_rgb(var(--shadow-color)/0.2)]",
          "animate-fade-up",
        )}
        role="dialog"
        aria-label="Cuộc gọi thoại"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/12 text-primary">
            <UserIcon size={40} weight="duotone" aria-hidden />
          </div>
          <h2 className="text-xl font-semibold text-text-primary">
            {peerName ?? "Cuộc gọi"}
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {statusLabel}
            {status === "active" && startedAt && (
              <Duration startedAt={startedAt} />
            )}
          </p>
        </div>

        {status === "incoming" && (
          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={onReject}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-primary shadow-lg pressable"
              aria-label="Từ chối"
            >
              <PhoneDisconnectIcon size={28} weight="fill" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => void onAccept()}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg pressable"
              aria-label="Nghe máy"
            >
              <PhoneIcon size={28} weight="fill" aria-hidden />
            </button>
          </div>
        )}

        {(status === "outgoing" || status === "connecting") && (
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={() => onHangup()}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-primary shadow-lg pressable"
              aria-label="Hủy gọi"
            >
              <PhoneDisconnectIcon size={28} weight="fill" aria-hidden />
            </button>
          </div>
        )}

        {status === "active" && (
          <div className="mt-8 flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={onToggleMute}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border pressable",
                isMuted
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border bg-surface-elevated text-text-primary",
              )}
              aria-label={isMuted ? "Bật micro" : "Tắt micro"}
            >
              {isMuted ? (
                <MicrophoneSlashIcon size={22} weight="fill" aria-hidden />
              ) : (
                <MicrophoneIcon size={22} weight="fill" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={() => onHangup()}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-on-primary shadow-lg pressable"
              aria-label="Kết thúc cuộc gọi"
            >
              <PhoneDisconnectIcon size={28} weight="fill" aria-hidden />
            </button>
          </div>
        )}

        {status === "ended" && (
          <p className="mt-6 text-center text-sm text-text-secondary">
            {endMessage ?? "Cuộc gọi đã kết thúc"}
          </p>
        )}

        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}

function Duration({ startedAt }: { startedAt: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () =>
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <span className="ml-2 font-mono tabular-nums text-primary">
      {formatDuration(elapsed)}
    </span>
  );
}
