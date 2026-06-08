"use client";

import { useEffect, useRef, useState } from "react";
import { parseVoiceContent, type MessagePublic } from "@hien-nha/shared";
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
      <p className="text-sm italic text-text-secondary">Không phát được tin thoại</p>
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
      className="flex min-w-[180px] items-center gap-3 text-left"
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm",
          isOwn ? "bg-primary/20 text-primary" : "bg-background/60",
        )}
      >
        {playing ? "⏸" : "▶"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-text-secondary">
          {formatDuration(voice.duration)}
        </p>
      </div>
    </button>
  );
}
