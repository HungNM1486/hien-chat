import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VOICE_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "video/webm",
]);

function publicUrl(subdir: string, filename: string): string {
  const base =
    process.env.API_PUBLIC_URL ??
    `http://localhost:${process.env.PORT ?? 4000}`;
  return `${base}/uploads/${subdir}/${filename}`;
}

function extForMime(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "video/webm": "webm",
  };
  return map[mimeType] ?? "bin";
}

async function saveFile(
  subdir: string,
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const dir = path.join(UPLOAD_ROOT, subdir);
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${extForMime(mimeType)}`;
  await writeFile(path.join(dir, filename), buffer);
  return publicUrl(subdir, filename);
}

export async function saveAvatar(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (!IMAGE_TYPES.has(mimeType)) {
    throw new Error("Chỉ hỗ trợ ảnh JPEG, PNG, WebP");
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Ảnh tối đa 5MB");
  }
  return saveFile("avatars", buffer, mimeType);
}

export async function saveChatImage(
  buffer: Buffer,
  mimeType: string,
): Promise<{ url: string; thumbnailUrl: string }> {
  if (!IMAGE_TYPES.has(mimeType)) {
    throw new Error("Chỉ hỗ trợ ảnh JPEG, PNG, WebP");
  }
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Ảnh tối đa 10MB");
  }
  const url = await saveFile("media", buffer, mimeType);
  return { url, thumbnailUrl: url };
}

export async function saveVoiceMessage(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  if (!VOICE_TYPES.has(mimeType)) {
    throw new Error("Định dạng audio không được hỗ trợ");
  }
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Tin thoại tối đa 10MB");
  }
  return saveFile("voice", buffer, mimeType);
}

export async function saveMediaUpload(
  buffer: Buffer,
  mimeType: string,
  kind: "image" | "voice",
): Promise<{ url: string; thumbnailUrl?: string }> {
  if (kind === "image") {
    const result = await saveChatImage(buffer, mimeType);
    return result;
  }
  const url = await saveVoiceMessage(buffer, mimeType);
  return { url };
}
