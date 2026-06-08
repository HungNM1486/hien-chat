"use client";

import type { AuthResponse, LoginInput, RegisterInput, UserPublic } from "@hien-nha/shared";
import { apiFetch, setAccessToken } from "@/lib/api-client";

export async function login(input: LoginInput): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const data = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  setAccessToken(data.accessToken);
  return data;
}

export async function logout(): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST" });
  setAccessToken(null);
}

async function refreshSession(): Promise<AuthResponse | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/auth/refresh`,
      { method: "POST", credentials: "include" },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as AuthResponse;
    setAccessToken(data.accessToken);
    return data;
  } catch {
    return null;
  }
}

export async function fetchMe(): Promise<UserPublic | null> {
  try {
    const data = await apiFetch<{ user: UserPublic }>("/auth/me");
    return data.user;
  } catch {
    const refreshed = await refreshSession();
    if (refreshed) return refreshed.user;
    setAccessToken(null);
    return null;
  }
}

export async function initSession(): Promise<UserPublic | null> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  if (token) {
    setAccessToken(token);
    const user = await fetchMe();
    if (user) return user;
  }

  const refreshed = await refreshSession();
  return refreshed?.user ?? null;
}
