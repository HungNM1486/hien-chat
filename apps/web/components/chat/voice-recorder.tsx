"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MicrophoneIcon, StopIcon } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

const MAX_DURATION_SEC = 120;

interface VoiceRecorderProps {
  onRecorded: (blob: Blob, duration: number) => void;
  disabled?: boolean;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({ onRecorded, disabled }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [cancelHint, setCancelHint] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startXRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const stopRecording = useCallback(
    (cancel = false) => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setRecording(false);
        setElapsed(0);
        setCancelHint(false);
        return;
      }

      recorder.onstop = () => {
        const duration = Math.max(
          1,
          Math.round((Date.now() - startTimeRef.current) / 1000),
        );
        if (!cancel && chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          onRecorded(blob, duration);
        }
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        setRecording(false);
        setElapsed(0);
        setCancelHint(false);
      };

      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    },
    [onRecorded],
  );

  const startRecording = async () => {
    if (disabled || recording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(200);
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setRecording(true);
      setElapsed(0);

      timerRef.current = setInterval(() => {
        const sec = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(sec);
        if (sec >= MAX_DURATION_SEC) {
          stopRecording(false);
        }
      }, 250);
    } catch {
      alert("Cần quyền micro để ghi tin thoại");
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    void startRecording();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!recording) return;
    setCancelHint(startXRef.current - e.clientX > 80);
  };

  const handlePointerUp = () => {
    if (!recording) return;
    stopRecording(cancelHint);
  };

  return (
    <>
      <IconButton
        icon={recording ? StopIcon : MicrophoneIcon}
        iconWeight={recording ? "fill" : "regular"}
        disabled={disabled}
        label="Ghi âm"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={cn(
          recording && "bg-accent text-on-primary shadow-[0_4px_16px_rgb(var(--shadow-color)/0.3)]",
        )}
      />

      {recording && (
        <div className="fixed inset-x-0 bottom-0 z-[150] flex flex-col items-center bg-background/95 px-4 py-10 text-text-primary backdrop-blur-xl">
          <div className="mb-5 flex h-14 items-end gap-1">
            {Array.from({ length: 16 }).map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-primary"
                style={{
                  height: `${10 + ((i * 7 + elapsed) % 6) * 5}px`,
                  opacity: 0.5 + ((i + elapsed) % 3) * 0.15,
                  transition: "height 0.15s ease",
                }}
              />
            ))}
          </div>
          <p className="font-mono text-2xl font-semibold tabular-nums">{formatTimer(elapsed)}</p>
          <p className="mt-3 text-sm text-text-secondary">
            {cancelHint ? "Thả để hủy" : "Vuốt trái để hủy · Thả để gửi"}
          </p>
        </div>
      )}
    </>
  );
}
