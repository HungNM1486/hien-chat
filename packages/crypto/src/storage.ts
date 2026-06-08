import type { SessionRecord, StoredIdentity } from "./types.js";

const DB_NAME = "hien-nha-crypto";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("identity")) {
        db.createObjectStore("identity");
      }
      if (!db.objectStoreNames.contains("sessions")) {
        db.createObjectStore("sessions", { keyPath: "conversationId" });
      }
      if (!db.objectStoreNames.contains("trustedIdentities")) {
        db.createObjectStore("trustedIdentities");
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = fn(store);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      }),
  );
}

export async function saveIdentity(data: StoredIdentity): Promise<void> {
  await tx("identity", "readwrite", (s) => s.put(data, "local"));
}

export async function loadIdentity(): Promise<StoredIdentity | null> {
  return tx("identity", "readonly", (s) => s.get("local"));
}

export async function saveSession(session: SessionRecord): Promise<void> {
  await tx("sessions", "readwrite", (s) => s.put(session));
}

export async function loadSession(
  conversationId: string,
): Promise<SessionRecord | null> {
  return tx("sessions", "readonly", (s) => s.get(conversationId));
}

export async function deleteSession(conversationId: string): Promise<void> {
  await tx("sessions", "readwrite", (s) => s.delete(conversationId));
}

export async function saveTrustedIdentity(
  userId: string,
  publicKeyB64: string,
): Promise<void> {
  await tx("trustedIdentities", "readwrite", (s) => s.put(publicKeyB64, userId));
}

export async function loadTrustedIdentity(
  userId: string,
): Promise<string | null> {
  return tx("trustedIdentities", "readonly", (s) => s.get(userId));
}

export async function clearAllCryptoData(): Promise<void> {
  const db = await openDb();
  for (const name of ["identity", "sessions", "trustedIdentities"]) {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(name, "readwrite");
      tx.objectStore(name).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
