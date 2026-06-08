import { LogoMark } from "@/components/brand/logo-mark";
import { cn } from "@/lib/utils";

interface LogoProps {
  showTagline?: boolean;
  markSize?: number;
  className?: string;
}

export function Logo({ showTagline = false, markSize = 44, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={markSize} />
      <div className="min-w-0 text-left">
        <p className="text-xl font-bold leading-tight tracking-tight text-text-primary">
          Hiên nhà
        </p>
        {showTagline && (
          <p className="text-xs text-text-secondary">Chuyện nhà trên hiên</p>
        )}
      </div>
    </div>
  );
}
