"use client";

import Link from "next/link";
import { WifiSlashIcon } from "@phosphor-icons/react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-[24px] bg-primary/10">
        <WifiSlashIcon size={40} weight="duotone" className="text-primary" aria-hidden />
      </div>
      <h1 className="mb-2 text-xl font-semibold tracking-tight text-text-primary">Mất kết nối</h1>
      <p className="mb-6 max-w-[280px] text-sm leading-relaxed text-text-secondary">
        Tin sẽ gửi khi có mạng trở lại
      </p>
      <Link href="/chats" className="btn-primary px-6">
        Thử lại
      </Link>
    </div>
  );
}
