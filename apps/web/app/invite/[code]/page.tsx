"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InvitePublic } from "@hien-nha/shared";
import { acceptInvite, fetchInvite } from "@/lib/chat-api";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore } from "@/stores/chat-store";
import { toast } from "@/stores/toast-store";

export default function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const upsertConversation = useChatStore((s) => s.upsertConversation);

  const [invite, setInvite] = useState<InvitePublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    fetchInvite(code.toUpperCase())
      .then(setInvite)
      .catch(() => setError("Mã mời không hợp lệ hoặc đã hết hạn"));
  }, [code]);

  const redirectTarget = `/invite/${code}`;

  const handleAccept = async () => {
    if (!user) return;
    setAccepting(true);
    try {
      const result = await acceptInvite(code.toUpperCase());
      if (result.conversation) {
        upsertConversation(result.conversation);
      }
      toast("Đã tham gia thành công", "success");
      if (result.conversationId) {
        router.replace(`/chats/${result.conversationId}`);
      } else {
        router.replace("/chats");
      }
    } catch {
      toast("Không thể chấp nhận lời mời", "error");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-[390px] rounded-2xl border border-border bg-surface p-6">
        <h1 className="mb-2 text-xl font-semibold text-text-primary">
          Lời mời tham gia
        </h1>

        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {!error && !invite && (
          <p className="text-sm text-text-secondary">Đang tải...</p>
        )}

        {invite && (
          <>
            {invite.conversationName ? (
              <p className="mb-4 text-text-primary">
                Bạn được mời vào nhóm{" "}
                <strong>{invite.conversationName}</strong>
              </p>
            ) : (
              <p className="mb-4 text-text-primary">
                Bạn được mời tham gia Hiên nhà
              </p>
            )}

            <p className="mb-6 text-sm text-text-secondary">
              Còn {invite.maxUses - invite.useCount} lượt · Hết hạn{" "}
              {new Date(invite.expiresAt).toLocaleString("vi-VN")}
            </p>

            {!isInitialized ? (
              <p className="text-sm text-text-secondary">Đang tải...</p>
            ) : user ? (
              <button
                type="button"
                disabled={accepting}
                onClick={handleAccept}
                className="w-full rounded-xl bg-primary py-3 font-medium text-on-primary disabled:opacity-50"
              >
                {accepting ? "Đang tham gia..." : "Chấp nhận lời mời"}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
                  className="block w-full rounded-xl bg-primary py-3 text-center font-medium text-on-primary"
                >
                  Đăng nhập để tham gia
                </Link>
                <Link
                  href={`/register?redirect=${encodeURIComponent(redirectTarget)}`}
                  className="block w-full rounded-xl border border-border py-3 text-center text-text-primary"
                >
                  Tạo tài khoản mới
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
