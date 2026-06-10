"use client";

import { useCallback, useEffect, useState } from "react";
import {
  decryptCiphertext,
  encryptPlaintext,
  hasSession,
  isEncryptedPayload,
} from "@hien-nha/crypto";
import type { MessagePublic } from "@hien-nha/shared";
import { clearE2ESession } from "@/lib/e2e-session";

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
      if (encryptionMode !== "e2e") {
        const staleKey = await hasSession(conversationId);
        if (staleKey) {
          await clearE2ESession(conversationId);
        }
        if (!cancelled) setReady(true);
        return;
      }

      if (!remoteUserId) {
        if (!cancelled) setReady(true);
        return;
      }

      const exists = await hasSession(conversationId);
      if (!cancelled) setReady(exists);
    }

    void init();
    const handleSessionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ conversationId: string }>).detail;
      if (detail?.conversationId === conversationId) void init();
    };
    window.addEventListener("hien:e2e-session-changed", handleSessionChange);
    return () => {
      cancelled = true;
      window.removeEventListener("hien:e2e-session-changed", handleSessionChange);
    };
  }, [conversationId, remoteUserId, encryptionMode]);

  const encryptIfNeeded = useCallback(
    async (content: string): Promise<{ content: string; encrypted: boolean }> => {
      if (encryptionMode !== "e2e") {
        return { content, encrypted: false };
      }
      if (!ready) throw new Error("Chưa nhập mã bí mật E2EE");
      const encrypted = await encryptPlaintext(conversationId, content);
      return { content: encrypted, encrypted: true };
    },
    [conversationId, encryptionMode, ready],
  );

  const markUndecrypted = useCallback(
    (msgs: MessagePublic[]): MessagePublic[] =>
      msgs.map((msg) => {
        if (!msg.encrypted && !isEncryptedPayload(msg.content)) return msg;
        return {
          ...msg,
          encrypted: true,
          decryptionState: "locked" as const,
        };
      }),
    [],
  );

  const decryptMessages = useCallback(
    async (msgs: MessagePublic[]): Promise<MessagePublic[]> => {
      if (encryptionMode !== "e2e") return msgs;
      if (!ready) return markUndecrypted(msgs);

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
            let replyTo = msg.replyTo;
            if (replyTo && isEncryptedPayload(replyTo.content)) {
              try {
                replyTo = {
                  ...replyTo,
                  content: await decryptCiphertext(
                    conversationId,
                    replyTo.content,
                  ),
                };
              } catch {
                replyTo = { ...replyTo, content: "Nội dung đã mã hóa" };
              }
            }
            result.push({
              ...msg,
              content: plain,
              encrypted: false,
              replyTo,
              decryptionState: "revealed",
            });
          } catch {
            result.push({
              ...msg,
              decryptionState: "locked",
            });
          }
        }
        return result;
      } finally {
        setDecrypting(false);
      }
    },
    [conversationId, encryptionMode, markUndecrypted, ready],
  );

  return {
    e2eReady: ready,
    decrypting,
    encryptIfNeeded,
    decryptMessages,
  };
}
