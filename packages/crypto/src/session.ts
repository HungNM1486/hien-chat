import { importLocalPrivateKey, importRemotePublicKey } from "./keys.js";
import {
  loadIdentity,
  loadSession,
  saveSession,
  saveTrustedIdentity,
} from "./storage.js";
import type { PreKeyBundlePublic, SessionRecord } from "./types.js";
import { bufToB64 } from "./encoding.js";

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
