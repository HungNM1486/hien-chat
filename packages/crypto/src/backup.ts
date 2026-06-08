import { bufToB64, b64ToBuf } from "./encoding.js";
import { loadIdentity, saveIdentity, clearAllCryptoData } from "./storage.js";
import type { StoredIdentity } from "./types.js";

async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  const saltBuf = salt as Uint8Array<ArrayBuffer>;
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuf,
      iterations: 100_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function exportEncryptedBackup(
  passphrase: string,
): Promise<Blob> {
  const identity = await loadIdentity();
  if (!identity) throw new Error("Không có khóa để backup");

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const plaintext = JSON.stringify(identity);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plaintext),
  );

  const backup = {
    v: 1,
    salt: bufToB64(salt.buffer),
    iv: bufToB64(iv.buffer),
    data: bufToB64(ciphertext),
  };

  return new Blob([JSON.stringify(backup)], {
    type: "application/json",
  });
}

export async function importEncryptedBackup(
  passphrase: string,
  file: Blob,
): Promise<void> {
  const text = await file.text();
  const backup = JSON.parse(text) as {
    v: number;
    salt: string;
    iv: string;
    data: string;
  };

  const salt = new Uint8Array(b64ToBuf(backup.salt));
  const iv = new Uint8Array(b64ToBuf(backup.iv));
  const key = await deriveKeyFromPassphrase(passphrase, salt);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    b64ToBuf(backup.data),
  );

  const identity = JSON.parse(
    new TextDecoder().decode(decrypted),
  ) as StoredIdentity;

  await saveIdentity(identity);
}

export async function wipeLocalKeys(): Promise<void> {
  await clearAllCryptoData();
}
