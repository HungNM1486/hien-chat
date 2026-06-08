import { cn } from "@/lib/utils";

type UserAvatarSize = "sm" | "md" | "lg" | "xl";

const sizeMap: Record<UserAvatarSize, string> = {
  sm: "h-10 w-10 rounded-[14px] text-sm",
  md: "h-[52px] w-[52px] rounded-[18px] text-lg",
  lg: "h-16 w-16 rounded-[22px] text-2xl",
  xl: "h-24 w-24 rounded-[28px] text-3xl",
};

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
  ring?: boolean;
}

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
  ring = false,
}: UserAvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";
  const dim = sizeMap[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={cn(
          "object-cover",
          dim,
          ring && "avatar-ring",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/12 to-primary/6 font-semibold text-primary",
        dim,
        ring && "avatar-ring",
        className,
      )}
    >
      {initial}
    </div>
  );
}
