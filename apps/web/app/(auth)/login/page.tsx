"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@hien-nha/shared";
import { login } from "@/lib/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { ApiError } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/chats";
  const setUser = useAuthStore((s) => s.setUser);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    setError(null);
    try {
      const result = await login(data);
      setUser(result.user);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đăng nhập thất bại");
    }
  });

  return (
    <div className="theme-card settings-card bg-surface/95 p-7 backdrop-blur-sm sm:p-8">
      <div className="mb-8 flex justify-center sm:hidden">
        <Logo showTagline markSize={44} />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Email
          </label>
          <input
            type="email"
            autoComplete="email"
            className="input-field"
            placeholder="email@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-accent">
              {String(errors.email.message ?? "")}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            Mật khẩu
          </label>
          <input
            type="password"
            autoComplete="current-password"
            className="input-field"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="mt-1.5 text-sm text-accent">
              {String(errors.password.message ?? "")}
            </p>
          )}
        </div>

        {error && (
          <p className="rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full"
        >
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-medium text-primary">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
