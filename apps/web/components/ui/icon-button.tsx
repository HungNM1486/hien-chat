"use client";

import type { Icon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: Icon;
  iconWeight?: "regular" | "bold" | "fill" | "duotone";
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "soft" | "primary";
  label: string;
}

const sizeClasses = {
  sm: "h-9 w-9 text-base",
  md: "h-[var(--touch-target)] w-[var(--touch-target)] text-xl",
  lg: "h-12 w-12 text-2xl",
};

const variantClasses = {
  ghost: "text-text-secondary hover:bg-foreground/5 hover:text-text-primary",
  soft: "border border-border/70 bg-surface-elevated/80 text-text-primary shadow-sm hover:border-primary/20 hover:bg-surface-elevated",
  primary: "bg-primary text-on-primary shadow-[0_8px_20px_rgb(var(--shadow-color)/0.24)] hover:-translate-y-0.5 hover:brightness-105",
};

export function IconButton({
  icon: IconComponent,
  iconWeight = "regular",
  size = "md",
  variant = "ghost",
  label,
  className,
  disabled,
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        "pressable inline-flex shrink-0 items-center justify-center rounded-full",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        sizeClasses[size],
        variantClasses[variant],
        disabled && "pointer-events-none opacity-40",
        className,
      )}
      {...props}
    >
      <IconComponent weight={iconWeight} aria-hidden />
    </button>
  );
}
