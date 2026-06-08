"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@hien-nha/shared";
import { register as registerUser } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ApiError } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/chats";
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      inviteCode: "",
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    try {
      const result = await registerUser(data);
      setUser(result.user);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đăng ký thất bại");
    }
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-lg">
      <div className="mb-6 flex justify-center">
        <Logo markSize={44} />
      </div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-text-primary">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Cần mã mời từ người quản lý
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Tên hiển thị" error={errors.displayName?.message}>
          <input
            type="text"
            autoComplete="name"
            className="field-input"
            placeholder="Tên của bạn"
            {...register("displayName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className="field-input"
            placeholder="email@example.com"
            {...register("email")}
          />
        </Field>

        <Field label="Mật khẩu" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="new-password"
            className="field-input"
            placeholder="Tối thiểu 8 ký tự"
            {...register("password")}
          />
        </Field>

        <Field label="Mã mời" error={errors.inviteCode?.message}>
          <input
            type="text"
            className="field-input"
            placeholder="WELCOME2024"
            {...register("inviteCode")}
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-[var(--touch-target)] w-full items-center justify-center rounded-xl bg-primary font-semibold text-on-primary transition-opacity disabled:opacity-60"
        >
          {isSubmitting ? "Đang tạo..." : "Đăng ký"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-primary">
          Đăng nhập
        </Link>
      </p>

      <style jsx global>{`
        .field-input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.75rem 1rem;
          color: var(--text-primary);
          outline: none;
        }
        .field-input:focus {
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-secondary">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-accent">{error}</p>}
    </div>
  );
}
