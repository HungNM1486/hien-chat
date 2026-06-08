"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  title: string;
  backHref?: string;
  right?: React.ReactNode;
  className?: string;
  onTitleClick?: () => void;
}

export function AppHeader({
  title,
  backHref,
  right,
  className,
  onTitleClick,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-[var(--header-height)] shrink-0 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur",
        className,
      )}
      style={{ paddingTop: "var(--safe-area-top)" }}
    >
      {backHref && (
        <Link
          href={backHref}
          className="flex min-h-[var(--touch-target)] min-w-[var(--touch-target)] items-center justify-center rounded-full text-primary"
          aria-label="Quay lại"
        >
          ←
        </Link>
      )}
      <h1
        className={cn(
          "flex-1 truncate text-base font-semibold text-text-primary",
          !backHref && "pl-0",
          onTitleClick && "cursor-pointer",
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
        {title}
      </h1>
      <div className="flex min-w-[var(--touch-target)] items-center justify-end">
        {right}
      </div>
    </header>
  );
}
