import { bufToB64 } from "./encoding.js";
import { loadIdentity, saveIdentity } from "./storage.js";
import type { PreKeyBundlePublic, StoredIdentity } from "./types.js";

async function generateEcKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"],
  );
}

async function exportPublicSpki(key: CryptoKey): Promise<string> {
  return bufToB64(await crypto.subtle.exportKey("spki", key));
}

async function exportPrivateJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey("jwk", key);
}

async function signData(
  privateKey: CryptoKey,
  data: BufferSource,
): Promise<string> {
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    data,
  );
  return bufToB64(sig);
}

async function generateSigningKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
}

export async function ensureIdentityKeys(): Promise<{
  identity: StoredIdentity;
  bundle: PreKeyBundlePublic;
}> {
  const existing = await loadIdentity();
  if (existing) {
    return {
      identity: existing,
      bundle: buildPublicBundle(existing),
    };
  }

  const identityPair = await generateEcKeyPair();
  const signedPreKeyPair = await generateEcKeyPair();
  const signingPair = await generateSigningKeyPair();

  const signedPreKeyId = Math.floor(Math.random() * 1_000_000);
  const signedPreKeyPublicB64 = await exportPublicSpki(signedPreKeyPair.publicKey);
  const signedPreKeySignature = await signData(
    signingPair.privateKey,
    new TextEncoder().encode(signedPreKeyPublicB64),
  );

  const oneTimePreKeys: StoredIdentity["oneTimePreKeys"] = [];
  for (let i = 0; i < 20; i++) {
    const otp = await generateEcKeyPair();
    oneTimePreKeys.push({
      id: i + 1,
      privateJwk: await exportPrivateJwk(otp.privateKey),
      publicB64: await exportPublicSpki(otp.publicKey),
    });
  }

  const identity: StoredIdentity = {
    identityPrivateJwk: await exportPrivateJwk(identityPair.privateKey),
    identityPublicB64: await exportPublicSpki(identityPair.publicKey),
    signedPreKeyPrivateJwk: await exportPrivateJwk(signedPreKeyPair.privateKey),
    signedPreKeyPublicB64: signedPreKeyPublicB64,
    signedPreKeyId,
    oneTimePreKeys,
  };

  await saveIdentity(identity);
  return { identity, bundle: buildPublicBundle(identity) };
}

function buildPublicBundle(identity: StoredIdentity): PreKeyBundlePublic {
  const otp = identity.oneTimePreKeys[0];
  return {
    identityKeyPublic: identity.identityPublicB64,
    signedPreKeyPublic: identity.signedPreKeyPublicB64,
    signedPreKeyId: identity.signedPreKeyId,
    signedPreKeySignature: "",
    oneTimePreKeyPublic: otp?.publicB64,
    oneTimePreKeyId: otp?.id,
  };
}

export async function consumeOneTimePreKey(): Promise<{
  bundle: PreKeyBundlePublic;
  updated: StoredIdentity;
} | null> {
  const identity = await loadIdentity();
  if (!identity || identity.oneTimePreKeys.length === 0) return null;

  const [used, ...rest] = identity.oneTimePreKeys;
  const updated: StoredIdentity = { ...identity, oneTimePreKeys: rest };
  await saveIdentity(updated);

  return {
    updated,
    bundle: {
      identityKeyPublic: updated.identityPublicB64,
      signedPreKeyPublic: updated.signedPreKeyPublicB64,
      signedPreKeyId: updated.signedPreKeyId,
      signedPreKeySignature: "",
      oneTimePreKeyPublic: used?.publicB64,
      oneTimePreKeyId: used?.id,
    },
  };
}

export async function importRemotePublicKey(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "spki",
    new Uint8Array(
      atob(b64)
        .split("")
        .map((c) => c.charCodeAt(0)),
    ),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
}

export async function importLocalPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"],
  );
}

export function getIdentityFingerprint(identity: StoredIdentity): string {
  return identity.identityPublicB64.slice(0, 40);
}

export { fingerprintPublicKey } from "./encoding.js";
