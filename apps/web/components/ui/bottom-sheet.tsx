"use client";

import { XIcon } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
  bodyClassName,
}: BottomSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-label="Đóng"
      />
      <div
        className={cn(
          "glass-panel relative flex max-h-[88vh] flex-col overflow-hidden rounded-t-[28px] border border-b-0 shadow-[0_-16px_48px_rgb(var(--shadow-color)/0.35)]",
          className,
        )}
        style={{ paddingBottom: "max(12px, var(--safe-area-bottom))" }}
      >
        <div className="flex shrink-0 flex-col items-center pt-2">
          <span className="mb-3 h-1 w-10 rounded-full bg-border/80" aria-hidden />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-text-primary">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-text-secondary">{subtitle}</p>
            )}
          </div>
          <IconButton
            icon={XIcon}
            size="sm"
            label="Đóng"
            onClick={onClose}
            className="text-text-secondary"
          />
        </div>

        <div className={cn("min-h-0 flex-1 overflow-y-auto", bodyClassName)}>
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-border/60 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
