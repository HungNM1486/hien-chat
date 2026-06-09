"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircleDotsIcon, GearSixIcon } from "@phosphor-icons/react";
import { Logo } from "@/components/brand/logo";
import { LogoMark } from "@/components/brand/logo-mark";
import { ThemeBadge } from "@/components/theme/theme-badge";
import { ThemeTagline } from "@/components/theme/theme-tagline";
import { useTheme } from "@/components/theme/theme-provider";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";

const items = [
  { href: "/chats", label: "Tin nhắn", icon: ChatCircleDotsIcon },
  { href: "/settings", label: "Cài đặt", icon: GearSixIcon },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { activeTheme } = useTheme();
  const unreadTotal = useChatStore((s) =>
    s.conversations.reduce((sum, c) => sum + c.unreadCount, 0),
  );

  return (
    <aside className="hidden w-[72px] shrink-0 flex-col items-center border-r border-border/50 bg-surface py-4 md:flex xl:w-56 xl:items-stretch xl:px-3">
      <div className="relative z-10 mb-4 hidden w-full px-2 xl:block">
        <Logo markSize={32} />
        <div className="mt-3 space-y-2">
          <ThemeBadge themeId={activeTheme.id} />
          <ThemeTagline themeId={activeTheme.id} className="text-[12px] leading-snug" />
        </div>
      </div>
      <div className="mb-6 flex justify-center xl:hidden">
        <LogoMark size={30} />
      </div>
      <nav className="flex w-full flex-col gap-1">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "pressable flex min-h-[var(--touch-target)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                "justify-center xl:justify-start",
                active
                  ? "bg-primary/12 text-primary"
                  : "text-text-secondary hover:bg-foreground/[0.04] hover:text-text-primary",
              )}
              title={item.label}
            >
              <span className="relative shrink-0">
                <Icon size={22} weight={active ? "fill" : "regular"} aria-hidden />
                {item.href === "/chats" && unreadTotal > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[9px] font-bold tabular-nums text-on-primary">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                )}
              </span>
              <span className="hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
