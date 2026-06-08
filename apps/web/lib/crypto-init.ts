import {
  ensureIdentityKeys,
  type PreKeyBundlePublic,
} from "@hien-nha/crypto";
import { uploadPreKeyBundle } from "./e2e-api";

export async function initUserCryptoKeys(): Promise<PreKeyBundlePublic> {
  const { bundle, identity } = await ensureIdentityKeys();

  await uploadPreKeyBundle({
    identityKeyPublic: bundle.identityKeyPublic,
    signedPreKeyPublic: bundle.signedPreKeyPublic,
    signedPreKeyId: bundle.signedPreKeyId,
    signedPreKeySignature: bundle.signedPreKeySignature ?? "",
    oneTimePreKeys: identity.oneTimePreKeys.map((k) => ({
      id: k.id,
      publicKey: k.publicB64,
    })),
  });

  return bundle;
}

export async function setupE2ESession(
  conversationId: string,
  remoteUserId: string,
): Promise<void> {
  const { establishSession } = await import("@hien-nha/crypto");
  const { fetchPreKeyBundle } = await import("./e2e-api");
  const remoteBundle = await fetchPreKeyBundle(remoteUserId);
  await establishSession(conversationId, remoteUserId, remoteBundle);
}
