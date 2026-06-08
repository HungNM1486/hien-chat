"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
import { useAuthStore } from "@/stores/auth-store";

const menuItems = [
  { href: "/settings/profile", icon: "👤", label: "Hồ sơ" },
  { href: "/settings/appearance", icon: "🎨", label: "Giao diện" },
  { href: "/settings/privacy", icon: "🔒", label: "Quyền riêng tư" },
  { href: "/settings/notifications", icon: "🔔", label: "Thông báo" },
];

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <AppShell header={<AppHeader title="Cài đặt" />}>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex items-center gap-4 border-b border-border px-4 py-6">
          <Avatar user={user} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-text-primary">
              {user?.displayName}
            </p>
            <p className="truncate text-sm text-text-secondary">{user?.email}</p>
          </div>
        </div>

        <nav className="flex flex-col py-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-[var(--touch-target)] items-center gap-4 px-4 py-3 transition-colors active:bg-white/5"
            >
              <span className="text-xl" aria-hidden>
                {item.icon}
              </span>
              <span className="text-text-primary">{item.label}</span>
              <span className="ml-auto text-text-secondary">›</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-border p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[var(--touch-target)] w-full items-center justify-center rounded-xl border border-accent/30 text-accent"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Avatar({
  user,
  size = "md",
}: {
  user: { displayName?: string; avatarUrl?: string | null } | null;
  size?: "md" | "lg";
}) {
  const dim = size === "lg" ? "h-16 w-16 text-2xl" : "h-10 w-10 text-base";

  if (user?.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        className={`${dim} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${dim} flex items-center justify-center rounded-full bg-primary/15 font-semibold text-primary`}
    >
      {user?.displayName?.charAt(0)?.toUpperCase() ?? "?"}
    </div>
  );
}
