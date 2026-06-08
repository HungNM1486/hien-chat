import type { FontSizeOption, ThemeId } from "@hien-nha/theme";
import type { UpdateProfileInput, UserPublic } from "@hien-nha/shared";
import { apiFetch } from "./api-client";
import { getAccessToken } from "./api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function updateProfile(
  input: UpdateProfileInput,
): Promise<UserPublic> {
  const data = await apiFetch<{ user: UserPublic }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function uploadAvatar(file: File): Promise<UserPublic> {
  const form = new FormData();
  form.append("file", file);

  let token = getAccessToken();
  let res = await fetch(`${API_URL}/users/me/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
    credentials: "include",
  });

  if (res.status === 401) {
    const refresh = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refresh.ok) {
      const data = (await refresh.json()) as { accessToken: string };
      token = data.accessToken;
      res = await fetch(`${API_URL}/users/me/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
        credentials: "include",
      });
    }
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? "Upload thất bại");
  }
  return (data as { user: UserPublic }).user;
}

export type { FontSizeOption, ThemeId };
