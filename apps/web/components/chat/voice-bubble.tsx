"use client";

import { useEffect, useRef, useState } from "react";
import { parseVoiceContent, type MessagePublic } from "@hien-nha/shared";
import { PauseIcon, PlayIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface VoiceBubbleProps {
  message: MessagePublic;
  isOwn: boolean;
}

export function VoiceBubble({ message, isOwn }: VoiceBubbleProps) {
  const voice = parseVoiceContent(message.content);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  if (!voice) {
    return (
      <p className="text-sm italic opacity-70">Không phát được tin thoại</p>
    );
  }

  const togglePlay = async () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(voice.url);
      audioRef.current.addEventListener("timeupdate", () => {
        const el = audioRef.current;
        if (!el || !el.duration) return;
        setProgress(el.currentTime / el.duration);
      });
      audioRef.current.addEventListener("ended", () => {
        setPlaying(false);
        setProgress(0);
      });
    }

    const el = audioRef.current;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      try {
        await el.play();
        setPlaying(true);
      } catch {
        // ignore autoplay restrictions
      }
    }
  };

  return (
    <button
      type="button"
      onClick={togglePlay}
      className="pressable flex min-w-[190px] items-center gap-3 text-left"
    >
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
          isOwn
            ? "bg-on-primary/15 text-on-primary"
            : "bg-primary/15 text-primary",
        )}
      >
        {playing ? (
          <PauseIcon size={18} weight="fill" aria-hidden />
        ) : (
          <PlayIcon size={18} weight="fill" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isOwn ? "bg-on-primary/80" : "bg-primary",
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p
          className={cn(
            "mt-1.5 font-mono text-[11px] tabular-nums",
            isOwn ? "text-on-primary/70" : "text-text-secondary",
          )}
        >
          {formatDuration(voice.duration)}
        </p>
      </div>
    </button>
  );
}
