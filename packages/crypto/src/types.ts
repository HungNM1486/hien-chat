export interface PreKeyBundlePublic {
  identityKeyPublic: string;
  signedPreKeyPublic: string;
  signedPreKeyId: number;
  signedPreKeySignature: string;
  oneTimePreKeyPublic?: string;
  oneTimePreKeyId?: number;
}

export interface EncryptedPayload {
  v: 1;
  iv: string;
  ct: string;
}

export interface StoredIdentity {
  identityPrivateJwk: JsonWebKey;
  identityPublicB64: string;
  signedPreKeyPrivateJwk: JsonWebKey;
  signedPreKeyPublicB64: string;
  signedPreKeyId: number;
  oneTimePreKeys: Array<{
    id: number;
    privateJwk: JsonWebKey;
    publicB64: string;
  }>;
}

export interface SessionRecord {
  conversationId: string;
  remoteUserId: string;
  keyRaw: string;
  createdAt: string;
}
