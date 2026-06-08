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
    <div className="theme-card settings-card bg-surface/95 p-7 backdrop-blur-sm sm:p-8">
      <div className="mb-6 flex justify-center sm:hidden">
        <Logo showTagline markSize={44} />
      </div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-text-primary">Tạo tài khoản</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Cần mã mời từ người quản lý
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Tên hiển thị" error={errors.displayName?.message}>
          <input
            type="text"
            autoComplete="name"
            className="input-field"
            placeholder="Tên của bạn"
            {...register("displayName")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message}>
          <input
            type="email"
            autoComplete="email"
            className="input-field"
            placeholder="email@example.com"
            {...register("email")}
          />
        </Field>

        <Field label="Mật khẩu" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="new-password"
            className="input-field"
            placeholder="Tối thiểu 8 ký tự"
            {...register("password")}
          />
        </Field>

        <Field label="Mã mời" error={errors.inviteCode?.message}>
          <input
            type="text"
            className="input-field"
            placeholder="WELCOME2024"
            {...register("inviteCode")}
          />
        </Field>

        {error && (
          <p className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">{error}</p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? "Đang tạo..." : "Đăng ký"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: unknown;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-secondary">{label}</label>
      {children}
      {error ? <p className="mt-1.5 text-sm text-accent">{String(error)}</p> : null}
    </div>
  );
}
