import { cn } from "@/lib/utils";

interface SafeAreaProps {
  children: React.ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
}

export function SafeArea({
  children,
  className,
  top = true,
  bottom = true,
}: SafeAreaProps) {
  return (
    <div
      className={cn(className)}
      style={{
        paddingTop: top ? "var(--safe-area-top)" : undefined,
        paddingBottom: bottom ? "var(--safe-area-bottom)" : undefined,
      }}
    >
      {children}
    </div>
  );
}
