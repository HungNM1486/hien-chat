import { importLocalPrivateKey, importRemotePublicKey } from "./keys.js";
import {
  loadIdentity,
  loadSession,
  saveSession,
  saveTrustedIdentity,
} from "./storage.js";
import type { PreKeyBundlePublic, SessionRecord } from "./types.js";
import { b64ToBuf, bufToB64 } from "./encoding.js";

const SHARED_KEY_ITERATIONS = 310_000;

async function deriveSessionKey(
  privateKey: CryptoKey,
  publicKey: CryptoKey,
): Promise<CryptoKey> {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

async function exportRawKey(key: CryptoKey): Promise<string> {
  return bufToB64(await crypto.subtle.exportKey("raw", key));
}

async function importRawKey(rawB64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(rawB64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function deriveSharedKeyMaterial(
  conversationId: string,
  secret: string,
  saltB64: string,
): Promise<{ keyRaw: string; verifier: string }> {
  const normalizedSecret = secret.normalize("NFKC");
  if (normalizedSecret.length < 6) {
    throw new Error("Mã bí mật phải có ít nhất 6 ký tự");
  }

  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(normalizedSecret),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const material = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations: SHARED_KEY_ITERATIONS,
      salt: new Uint8Array(b64ToBuf(saltB64)),
    },
    baseKey,
    512,
  );
  const bytes = new Uint8Array(material);
  const encryptionKey = bytes.slice(0, 32);
  const confirmationKey = bytes.slice(32);
  const verifierInput = new Uint8Array(
    confirmationKey.length + new TextEncoder().encode(conversationId).length,
  );
  verifierInput.set(confirmationKey);
  verifierInput.set(new TextEncoder().encode(conversationId), confirmationKey.length);
  const verifier = await crypto.subtle.digest("SHA-256", verifierInput);

  return {
    keyRaw: bufToB64(encryptionKey.buffer),
    verifier: bufToB64(verifier),
  };
}

async function saveSharedSession(
  conversationId: string,
  keyRaw: string,
): Promise<void> {
  await saveSession({
    conversationId,
    remoteUserId: "shared-secret",
    keyRaw,
    createdAt: new Date().toISOString(),
    source: "shared-secret",
  });
}

export async function createSharedSecretSession(
  conversationId: string,
  secret: string,
): Promise<{ salt: string; verifier: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltB64 = bufToB64(salt.buffer);
  const material = await deriveSharedKeyMaterial(
    conversationId,
    secret,
    saltB64,
  );
  await saveSharedSession(conversationId, material.keyRaw);
  return { salt: saltB64, verifier: material.verifier };
}

export async function unlockSharedSecretSession(
  conversationId: string,
  secret: string,
  salt: string,
): Promise<{ verifier: string }> {
  const material = await deriveSharedKeyMaterial(conversationId, secret, salt);
  await saveSharedSession(conversationId, material.keyRaw);
  return { verifier: material.verifier };
}

export async function establishSession(
  conversationId: string,
  remoteUserId: string,
  remoteBundle: PreKeyBundlePublic,
): Promise<void> {
  const identity = await loadIdentity();
  if (!identity) throw new Error("Chưa có identity key");

  const localPrivate = await importLocalPrivateKey(identity.identityPrivateJwk);
  const remotePublic = await importRemotePublicKey(
    remoteBundle.signedPreKeyPublic || remoteBundle.identityKeyPublic,
  );

  const sessionKey = await deriveSessionKey(localPrivate, remotePublic);
  const keyRaw = await exportRawKey(sessionKey);

  const record: SessionRecord = {
    conversationId,
    remoteUserId,
    keyRaw,
    createdAt: new Date().toISOString(),
    source: "prekey",
  };

  await saveSession(record);
  await saveTrustedIdentity(remoteUserId, remoteBundle.identityKeyPublic);
}

export async function hasSession(conversationId: string): Promise<boolean> {
  return !!(await loadSession(conversationId));
}

export async function getSessionKey(
  conversationId: string,
): Promise<CryptoKey | null> {
  const session = await loadSession(conversationId);
  if (!session) return null;
  return importRawKey(session.keyRaw);
}

export async function removeSession(conversationId: string): Promise<void> {
  const { deleteSession } = await import("./storage.js");
  await deleteSession(conversationId);
}

export async function getLocalBundleForUpload(): Promise<PreKeyBundlePublic> {
  const { ensureIdentityKeys } = await import("./keys.js");
  const { bundle } = await ensureIdentityKeys();
  return bundle;
}
