import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** Biểu tượng hiên nhà — 3 cột, mái cong, chậu cây */
export function LogoMark({ size = 40, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="48" height="48" rx="12" fill="#FFF8F0" />
      <path
        d="M8 22c6-8 26-8 32 0"
        stroke="#5C4033"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 22c5-6 23-6 28 0v3H10v-3z"
        fill="#E8A598"
        stroke="#5C4033"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <rect x="14" y="25" width="3.5" height="12" rx="1" fill="#E8A598" stroke="#5C4033" strokeWidth="1.2" />
      <rect x="22.25" y="25" width="3.5" height="12" rx="1" fill="#E8A598" stroke="#5C4033" strokeWidth="1.2" />
      <rect x="30.5" y="25" width="3.5" height="12" rx="1" fill="#E8A598" stroke="#5C4033" strokeWidth="1.2" />
      <rect x="12" y="37" width="24" height="2.5" rx="1" fill="#E8A598" stroke="#5C4033" strokeWidth="1" />
      <rect x="9" y="35" width="4" height="3" rx="0.8" fill="#5C4033" />
      <path
        d="M10 32c0-2 1.5-3.5 1.5-3.5s1.5 1.5 1.5 3.5c0 1.2-.7 2-1.5 2s-1.5-.8-1.5-2z"
        fill="#5C4033"
      />
      <path d="M9 30.5c1-2 2.5-3 2.5-3s1.5 1 2.5 3" stroke="#5C4033" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11.5 30.5c1-2 2.5-3 2.5-3s1.5 1 2.5 3" stroke="#5C4033" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
