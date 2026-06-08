"use client";

import { useCallback, useEffect, useState } from "react";
import {
  decryptCiphertext,
  encryptPlaintext,
  hasSession,
  isEncryptedPayload,
} from "@hien-nha/crypto";
import type { MessagePublic } from "@hien-nha/shared";
import { setupE2ESession } from "@/lib/crypto-init";

export function useE2ECrypto(
  conversationId: string,
  remoteUserId: string | undefined,
  encryptionMode: string | undefined,
) {
  const [ready, setReady] = useState(false);
  const [decrypting, setDecrypting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (encryptionMode !== "e2e" || !remoteUserId) {
        setReady(true);
        return;
      }

      const exists = await hasSession(conversationId);
      if (exists) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        await setupE2ESession(conversationId, remoteUserId);
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) setReady(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [conversationId, remoteUserId, encryptionMode]);

  const encryptIfNeeded = useCallback(
    async (content: string): Promise<{ content: string; encrypted: boolean }> => {
      if (encryptionMode !== "e2e" || !ready) {
        return { content, encrypted: false };
      }
      const encrypted = await encryptPlaintext(conversationId, content);
      return { content: encrypted, encrypted: true };
    },
    [conversationId, encryptionMode, ready],
  );

  const decryptMessages = useCallback(
    async (msgs: MessagePublic[]): Promise<MessagePublic[]> => {
      if (encryptionMode !== "e2e" || !ready) return msgs;

      setDecrypting(true);
      try {
        const result: MessagePublic[] = [];
        for (const msg of msgs) {
          if (!msg.encrypted && !isEncryptedPayload(msg.content)) {
            result.push(msg);
            continue;
          }
          try {
            const plain = await decryptCiphertext(conversationId, msg.content);
            result.push({ ...msg, content: plain, encrypted: false });
          } catch {
            result.push({
              ...msg,
              content: "Không thể giải mã — thử xác minh lại khóa",
            });
          }
        }
        return result;
      } finally {
        setDecrypting(false);
      }
    },
    [conversationId, encryptionMode, ready],
  );

  return {
    e2eReady: ready,
    decrypting,
    encryptIfNeeded,
    decryptMessages,
  };
}
