"use client";

import Link from "next/link";
import { CaretLeftIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  right?: React.ReactNode;
  className?: string;
  onTitleClick?: () => void;
}

export function AppHeader({
  title,
  subtitle,
  backHref,
  right,
  className,
  onTitleClick,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "chat-column-header glass-panel z-40 flex flex-col border-b",
        className,
      )}
      style={{ paddingTop: "var(--safe-area-top)" }}
    >
      <div className="theme-accent-bar shrink-0 lg:hidden" aria-hidden />
      <div className="flex h-[var(--header-height)] items-center gap-1 px-3 lg:gap-2 lg:px-5">
        {backHref && (
          <Link
            href={backHref}
            className="pressable -ml-1 flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            aria-label="Quay lại"
          >
            <CaretLeftIcon size={22} weight="bold" aria-hidden />
          </Link>
        )}
        <div
          className={cn(
            "min-w-0 flex-1",
            onTitleClick && "cursor-pointer rounded-lg px-1 py-0.5 transition-colors hover:bg-foreground/[0.04]",
          )}
          onClick={onTitleClick}
          onKeyDown={
            onTitleClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") onTitleClick();
                }
              : undefined
          }
          role={onTitleClick ? "button" : undefined}
          tabIndex={onTitleClick ? 0 : undefined}
        >
          <h1 className="truncate text-[17px] font-semibold tracking-tight text-text-primary lg:text-[18px]">
            {title}
          </h1>
          {subtitle && (
            <p className="truncate text-[12px] text-text-secondary">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-0.5">{right}</div>
      </div>
    </header>
  );
}
