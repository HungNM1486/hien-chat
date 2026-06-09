"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BellIcon,
  CaretRightIcon,
  LockSimpleIcon,
  PaletteIcon,
  SignOutIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";
import { AppShell } from "@/components/layout/app-shell";
import { AppHeader } from "@/components/layout/app-header";
import { SettingsScroll } from "@/components/layout/settings-scroll";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ThemeBadge } from "@/components/theme/theme-badge";
import { ThemeTagline } from "@/components/theme/theme-tagline";
import { useTheme } from "@/components/theme/theme-provider";
import { useAuthStore } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

const menuItems = [
  { href: "/settings/profile", icon: UserCircleIcon, label: "Hồ sơ" },
  { href: "/settings/appearance", icon: PaletteIcon, label: "Giao diện" },
  { href: "/settings/privacy", icon: LockSimpleIcon, label: "Quyền riêng tư" },
  { href: "/settings/notifications", icon: BellIcon, label: "Thông báo" },
];

export default function SettingsPage() {
  const { activeTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <AppShell header={<AppHeader title="Cài đặt" subtitle="Tài khoản & ứng dụng" />}>
      <SettingsScroll>
        <div className="theme-pattern-surface mx-0 mt-4 overflow-hidden rounded-[var(--radius-card,22px)] border border-border/70 bg-surface/80 shadow-[0_14px_38px_rgb(var(--shadow-color)/0.08)] lg:mt-6">
          <div className="theme-accent-bar" aria-hidden />
          <div className="relative z-10 flex items-center gap-4 px-4 py-5">
            <UserAvatar
              name={user?.displayName}
              avatarUrl={user?.avatarUrl}
              size="lg"
              ring
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold tracking-tight text-text-primary">
                {user?.displayName}
              </p>
              <p className="truncate text-sm text-text-secondary">{user?.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ThemeBadge themeId={activeTheme.id} size="md" />
              </div>
              <ThemeTagline themeId={activeTheme.id} className="mt-1.5 text-[12px]" />
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-2 py-4 lg:grid lg:grid-cols-2 lg:gap-3 lg:py-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="pressable flex min-h-[var(--touch-target)] items-center gap-3 rounded-[18px] border border-transparent px-3 py-3 transition-colors hover:border-border/70 hover:bg-surface/76"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary/10 text-primary">
                  <Icon size={20} weight="duotone" aria-hidden />
                </span>
                <span className="flex-1 font-medium text-text-primary">{item.label}</span>
                <CaretRightIcon size={16} className="text-text-secondary" aria-hidden />
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border/60 p-4 lg:px-0 lg:pb-6 lg:pt-8">
          <button
            type="button"
            onClick={handleLogout}
            className={cn("btn-danger w-full gap-2 lg:max-w-sm")}
          >
            <SignOutIcon size={18} aria-hidden />
            Đăng xuất
          </button>
        </div>
      </SettingsScroll>
    </AppShell>
  );
}
