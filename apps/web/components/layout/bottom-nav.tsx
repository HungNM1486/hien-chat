"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChatCircleDotsIcon, GearSixIcon } from "@phosphor-icons/react";
import { useChatStore } from "@/stores/chat-store";
import { cn } from "@/lib/utils";

const items = [
  { href: "/chats", label: "Tin nhắn", icon: ChatCircleDotsIcon },
  { href: "/settings", label: "Cài đặt", icon: GearSixIcon },
];

export function BottomNav() {
  const pathname = usePathname();
  const unreadTotal = useChatStore((s) =>
    s.conversations.reduce((sum, c) => sum + c.unreadCount, 0),
  );

  return (
    <nav
      className="glass-panel fixed inset-x-0 bottom-0 z-50 border-t md:hidden"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
    >
      <div className="theme-accent-bar" aria-hidden />
      <div className="mx-auto flex h-[var(--bottom-nav-height)] max-w-lg items-stretch px-6">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "pressable relative flex flex-1 flex-col items-center justify-center gap-0.5",
                "min-h-[var(--touch-target)] text-[11px] font-semibold transition-colors",
                active ? "text-primary" : "text-text-secondary",
              )}
            >
              <div
                className={cn(
                  "relative flex h-9 w-14 items-center justify-center rounded-full transition-colors",
                  active && "bg-primary/12",
                )}
              >
                <Icon
                  size={22}
                  weight={active ? "fill" : "regular"}
                  aria-hidden
                />
                {item.href === "/chats" && unreadTotal > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold tabular-nums text-on-primary">
                    {unreadTotal > 99 ? "99+" : unreadTotal}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
