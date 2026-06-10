import { getSessionKey } from "./session.js";
import type { EncryptedPayload } from "./types.js";
import { bufToB64, b64ToBuf } from "./encoding.js";

export async function encryptPlaintext(
  conversationId: string,
  plaintext: string,
): Promise<string> {
  const key = await getSessionKey(conversationId);
  if (!key) throw new Error("Chưa có session E2E");

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(conversationId),
    },
    key,
    encoded,
  );

  const payload: EncryptedPayload = {
    v: 2,
    iv: bufToB64(iv.buffer),
    ct: bufToB64(ciphertext),
  };

  return JSON.stringify(payload);
}

export async function decryptCiphertext(
  conversationId: string,
  content: string,
): Promise<string> {
  const key = await getSessionKey(conversationId);
  if (!key) throw new Error("Chưa có session E2E");

  let payload: EncryptedPayload;
  try {
    payload = JSON.parse(content) as EncryptedPayload;
  } catch {
    throw new Error("Invalid ciphertext");
  }

  const iv = new Uint8Array(b64ToBuf(payload.iv));
  const ct = b64ToBuf(payload.ct);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(conversationId),
    },
    key,
    ct,
  );

  return new TextDecoder().decode(decrypted);
}

export function isEncryptedPayload(content: string): boolean {
  try {
    const parsed = JSON.parse(content) as EncryptedPayload;
    return (
      parsed.v === 2 &&
      typeof parsed.iv === "string" &&
      typeof parsed.ct === "string"
    );
  } catch {
    return false;
  }
}

export async function encryptBlob(
  conversationId: string,
  blob: Blob,
): Promise<Blob> {
  const key = await getSessionKey(conversationId);
  if (!key) throw new Error("Chưa có session E2E");

  const buffer = await blob.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(conversationId),
    },
    key,
    buffer,
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return new Blob([combined], { type: "application/octet-stream" });
}

export async function decryptBlob(
  conversationId: string,
  blob: Blob,
): Promise<Blob> {
  const key = await getSessionKey(conversationId);
  if (!key) throw new Error("Chưa có session E2E");

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: new TextEncoder().encode(conversationId),
    },
    key,
    ct,
  );

  return new Blob([decrypted]);
}
