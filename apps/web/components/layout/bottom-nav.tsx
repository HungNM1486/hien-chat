"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/chats", label: "Chats", icon: "💬" },
  { href: "/settings", label: "Cài đặt", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: "var(--safe-area-bottom)" }}
    >
      <div className="flex h-[var(--bottom-nav-height)] items-stretch">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
                "min-h-[var(--touch-target)]",
                active ? "text-primary" : "text-text-secondary",
              )}
            >
              <span className="text-lg" aria-hidden>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
