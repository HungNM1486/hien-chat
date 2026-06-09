import { cn } from "@/lib/utils";

interface SettingsScrollProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

export function SettingsScroll({
  children,
  className,
  narrow = false,
}: SettingsScrollProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col overflow-y-auto",
        "lg:px-6 lg:py-2",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto w-full flex-1",
          narrow ? "max-w-xl" : "max-w-2xl lg:max-w-3xl",
        )}
      >
        {children}
      </div>
    </div>
  );
}
