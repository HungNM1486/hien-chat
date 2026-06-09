"use client";

import { SafeArea } from "@/components/layout/safe-area";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  hideBottomNav?: boolean;
  className?: string;
}

export function AppShell({
  children,
  header,
  hideBottomNav = false,
  className,
}: AppShellProps) {
  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-transparent md:h-auto md:min-h-full md:p-3 lg:p-4 xl:p-5">
      <div
        className="theme-shell-frame mx-auto flex h-full min-h-0 w-full flex-1 overflow-hidden md:min-h-[calc(100dvh-1.5rem)] md:rounded-[var(--radius-card,20px)] md:border md:border-border/60 md:bg-surface/75 md:backdrop-blur-xl lg:min-h-[calc(100dvh-2rem)] xl:min-h-[calc(100dvh-2.5rem)]"
        style={{ maxWidth: "min(100%, var(--shell-max-width))" }}
      >
        <SidebarNav />
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="theme-accent-bar hidden shrink-0 md:block" aria-hidden />
          {header}
          <main
            className={cn(
              "flex min-h-0 flex-1 flex-col overflow-hidden",
              !hideBottomNav && "pb-[calc(var(--bottom-nav-height)+var(--safe-area-bottom))] md:pb-0",
              className,
            )}
          >
            <SafeArea top={!header} bottom={false} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              {children}
            </SafeArea>
          </main>
          {!hideBottomNav && <BottomNav />}
        </div>
      </div>
    </div>
  );
}
