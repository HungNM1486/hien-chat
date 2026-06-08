"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EnvelopeSimpleOpenIcon } from "@phosphor-icons/react";
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
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--primary) 18%, transparent), transparent)",
        }}
      />
      <div className="relative w-full max-w-[390px] rounded-[28px] border border-border/60 bg-surface/80 p-8 shadow-[0_24px_64px_rgb(var(--shadow-color)/0.2)] backdrop-blur-sm">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10">
            <EnvelopeSimpleOpenIcon size={28} weight="duotone" className="text-primary" aria-hidden />
          </div>
        </div>
        <h1 className="mb-2 text-center text-xl font-semibold tracking-tight text-text-primary">
          Lời mời tham gia
        </h1>

        {error && (
          <p className="text-center text-sm text-accent">{error}</p>
        )}

        {!error && !invite && (
          <p className="text-center text-sm text-text-secondary">Đang tải...</p>
        )}

        {invite && (
          <>
            {invite.conversationName ? (
              <p className="mb-4 text-center text-text-primary">
                Bạn được mời vào nhóm{" "}
                <strong>{invite.conversationName}</strong>
              </p>
            ) : (
              <p className="mb-4 text-center text-text-primary">
                Bạn được mời tham gia Hiên nhà
              </p>
            )}

            <p className="mb-6 text-center text-sm text-text-secondary">
              Còn {invite.maxUses - invite.useCount} lượt · Hết hạn{" "}
              {new Date(invite.expiresAt).toLocaleString("vi-VN")}
            </p>

            {!isInitialized ? (
              <p className="text-center text-sm text-text-secondary">Đang tải...</p>
            ) : user ? (
              <button
                type="button"
                disabled={accepting}
                onClick={handleAccept}
                className="btn-primary w-full"
              >
                {accepting ? "Đang tham gia..." : "Chấp nhận lời mời"}
              </button>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
                  className="btn-primary block w-full text-center"
                >
                  Đăng nhập để tham gia
                </Link>
                <Link
                  href={`/register?redirect=${encodeURIComponent(redirectTarget)}`}
                  className="btn-secondary block w-full text-center"
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
