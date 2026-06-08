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
    <div className="flex min-h-full bg-background md:justify-center">
      <div className="flex min-h-full w-full max-w-[480px] flex-1 md:max-w-none md:flex-row">
        <SidebarNav />
        <div className="flex min-h-full flex-1 flex-col md:max-w-[480px] md:border-x md:border-border">
          {header}
          <main
            className={cn(
              "flex flex-1 flex-col overflow-hidden",
              !hideBottomNav && "pb-[calc(var(--bottom-nav-height)+var(--safe-area-bottom))] md:pb-0",
              className,
            )}
          >
            <SafeArea top={!header} bottom={false} className="flex flex-1 flex-col overflow-hidden">
              {children}
            </SafeArea>
          </main>
          {!hideBottomNav && <BottomNav />}
        </div>
      </div>
    </div>
  );
}
