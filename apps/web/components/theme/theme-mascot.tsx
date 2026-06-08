"use client";

import Image from "next/image";
import type { PresetThemeId } from "@hien-nha/theme";
import { cn } from "@/lib/utils";

interface ThemeMascotProps {
  themeId: PresetThemeId | string;
  size?: number;
  className?: string;
}

function MascotSvg({
  themeId,
  size,
  className,
}: {
  themeId: string;
  size: number;
  className?: string;
}) {
  const common = cn("shrink-0", className);

  switch (themeId) {
    case "midnight":
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" className={common} aria-hidden>
          <rect width="96" height="96" rx="24" fill="var(--surface)" />
          <circle cx="72" cy="22" r="3" fill="var(--primary)" opacity="0.7" />
          <circle cx="80" cy="34" r="2" fill="var(--accent)" opacity="0.5" />
          <circle cx="64" cy="30" r="1.5" fill="var(--foreground)" opacity="0.35" />
          <path
            d="M48 24c-14 0-22 12-22 22 0 16 22 34 22 34s22-18 22-34c0-10-8-22-22-22z"
            fill="var(--primary)"
            opacity="0.25"
          />
          <path
            d="M30 38c8-14 28-14 36 0-4 10-14 16-18 16s-14-6-18-16z"
            fill="var(--primary)"
          />
          <rect x="22" y="58" width="52" height="4" rx="2" fill="var(--border)" />
          <rect x="26" y="64" width="12" height="14" rx="2" fill="var(--bubble-sent)" />
          <rect x="42" y="64" width="12" height="14" rx="2" fill="var(--bubble-sent)" />
          <rect x="58" y="64" width="12" height="14" rx="2" fill="var(--bubble-sent)" />
        </svg>
      );
    case "forest":
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" className={common} aria-hidden>
          <rect width="96" height="96" rx="24" fill="var(--surface)" />
          <ellipse cx="48" cy="78" rx="30" ry="6" fill="var(--primary)" opacity="0.2" />
          <path d="M48 18 L68 58 H28 Z" fill="var(--primary)" />
          <path d="M48 30 L60 58 H36 Z" fill="var(--primary)" opacity="0.65" />
          <rect x="44" y="58" width="8" height="18" rx="2" fill="#8B5E3C" />
          <circle cx="30" cy="52" r="6" fill="var(--accent)" opacity="0.55" />
          <circle cx="66" cy="48" r="4" fill="var(--accent)" opacity="0.4" />
        </svg>
      );
    case "ocean":
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" className={common} aria-hidden>
          <rect width="96" height="96" rx="24" fill="var(--surface)" />
          <path
            d="M0 58 Q24 48 48 58 T96 58 V96 H0 Z"
            fill="var(--primary)"
            opacity="0.35"
          />
          <path
            d="M0 68 Q24 58 48 68 T96 68 V96 H0 Z"
            fill="var(--primary)"
            opacity="0.55"
          />
          <ellipse cx="62" cy="42" rx="10" ry="7" fill="var(--accent)" opacity="0.75" />
          <path d="M52 42c4-2 8-2 12 0" stroke="var(--foreground)" strokeWidth="1.5" fill="none" opacity="0.4" />
          <circle cx="28" cy="30" r="8" fill="#FFD54F" opacity="0.85" />
        </svg>
      );
    case "paper":
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" className={common} aria-hidden>
          <rect width="96" height="96" rx="24" fill="var(--surface)" />
          <rect x="22" y="16" width="52" height="64" rx="4" fill="var(--bubble-received)" stroke="var(--border)" />
          {[28, 36, 44, 52, 60, 68].map((y) => (
            <line
              key={y}
              x1="30"
              y1={y}
              x2="66"
              y2={y}
              stroke="var(--border)"
              strokeWidth="1"
            />
          ))}
          <path
            d="M34 36h24M34 44h18M34 52h22"
            stroke="var(--text-secondary)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.45"
          />
          <rect x="58" y="62" width="18" height="6" rx="2" fill="var(--accent)" transform="rotate(-35 67 65)" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 96 96" className={common} aria-hidden>
          <rect width="96" height="96" rx="24" fill="var(--primary)" opacity="0.15" />
          <text x="48" y="58" textAnchor="middle" fontSize="40">
            ✨
          </text>
        </svg>
      );
  }
}

export function ThemeMascot({ themeId, size = 80, className }: ThemeMascotProps) {
  if (themeId === "warm-home") {
    return (
      <Image
        src="/images/hello-kitty/mascot.png"
        alt=""
        width={size}
        height={size}
        className={cn("shrink-0 object-cover", className)}
        aria-hidden
      />
    );
  }

  return <MascotSvg themeId={themeId} size={size} className={className} />;
}
