"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowCounterClockwiseIcon, ChatCircleDotsIcon } from "@phosphor-icons/react";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[chat error]", error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 bg-background px-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-accent/10">
        <ChatCircleDotsIcon size={32} weight="duotone" className="text-accent" aria-hidden />
      </div>
      <div>
        <p className="text-lg font-semibold tracking-tight text-text-primary">
          Không mở được cuộc trò chuyện
        </p>
        <p className="mt-2 max-w-[320px] text-sm leading-relaxed text-text-secondary">
          {error.message || "Đã xảy ra lỗi khi tải trang chat."}
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary inline-flex gap-2 px-5 py-2.5 text-sm"
        >
          <ArrowCounterClockwiseIcon size={16} aria-hidden />
          Thử lại
        </button>
        <Link href="/chats" className="btn-secondary px-5 py-2.5 text-sm">
          Quay lại
        </Link>
      </div>
    </div>
  );
}
