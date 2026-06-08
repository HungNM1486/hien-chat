import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu tối thiểu 8 ký tự")
    .max(128, "Mật khẩu quá dài"),
  displayName: z
    .string()
    .min(1, "Tên hiển thị không được trống")
    .max(64, "Tên hiển thị quá dài"),
  inviteCode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được trống"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export interface UserPublic {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  settings: UserSettings;
  createdAt: string;
}

export interface UserSettings {
  theme?: string;
  locale?: string;
  fontSize?: "normal" | "large" | "xlarge";
  reduceMotion?: boolean;
  hideLastSeen?: boolean;
  hideReadReceipts?: boolean;
}

export interface AuthResponse {
  user: UserPublic;
  accessToken: string;
}

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(64).optional(),
  avatarUrl: z.string().url().nullable().optional(),
  settings: z
    .object({
      theme: z.string().optional(),
      locale: z.string().optional(),
      fontSize: z.enum(["normal", "large", "xlarge"]).optional(),
      reduceMotion: z.boolean().optional(),
      hideLastSeen: z.boolean().optional(),
      hideReadReceipts: z.boolean().optional(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
