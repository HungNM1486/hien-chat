"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const items = [
  { href: "/chats", label: "Chats" },
  { href: "/settings", label: "Cài đặt" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-80 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div
        className="flex h-[var(--header-height)] items-center border-b border-border px-4"
        style={{ paddingTop: "var(--safe-area-top)" }}
      >
        <Logo markSize={36} />
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                "min-h-[var(--touch-target)] flex items-center",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-text-secondary hover:bg-white/5",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
