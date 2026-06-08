"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import imageCompression from "browser-image-compression";
import { isEncryptedPayload } from "@hien-nha/crypto";
import type { MessagePublic } from "@hien-nha/shared";
import {
  addReaction as addReactionApi,
  fetchConversation,
  fetchMessages,
  markConversationRead,
  removeReaction as removeReactionApi,
  sendMessage as sendMessageApi,
  uploadMedia,
} from "@/lib/chat-api";
import { useWsSend } from "@/contexts/ws-context";
import { useE2ECrypto } from "@/hooks/useE2ECrypto";
import { useAuthStore } from "@/stores/auth-store";
import { useChatStore, EMPTY_MESSAGES, EMPTY_TYPING_USERS } from "@/stores/chat-store";
import { toast } from "@/stores/toast-store";

function buildOptimisticMessage(
  conversationId: string,
  user: NonNullable<ReturnType<typeof useAuthStore.getState>["user"]>,
  partial: Pick<MessagePublic, "content" | "contentType"> & {
    replyToId?: string | null;
    replyTo?: MessagePublic["replyTo"];
  },
  id = `temp-${Date.now()}`,
): MessagePublic {
  return {
    id,
    conversationId,
    senderId: user.id,
    content: partial.content,
    contentType: partial.contentType,
    encrypted: false,
    replyToId: partial.replyToId ?? null,
    replyTo: partial.replyTo ?? null,
    createdAt: new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
    sender: {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    },
  };
}

export function useChat(conversationId: string) {
  const user = useAuthStore((s) => s.user);
  const send = useWsSend();

  const messages = useChatStore(
    (s) => s.messagesByConversation[conversationId] ?? EMPTY_MESSAGES,
  );
  const typingUsers = useChatStore(
    (s) => s.typingByConversation[conversationId] ?? EMPTY_TYPING_USERS,
  );
  const otherReadMessageId = useChatStore(
    (s) => s.otherReadByConversation[conversationId] ?? null,
  );
  const otherUserOnline = useChatStore(
    (s) => s.otherOnlineByConversation[conversationId] ?? false,
  );
  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === conversationId),
  );

  const { e2eReady, decrypting, encryptIfNeeded, decryptMessages } =
    useE2ECrypto(
      conversationId,
      conversation?.otherUserId,
      conversation?.encryptionMode,
    );

  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const addMessage = useChatStore((s) => s.addMessage);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const clearUnread = useChatStore((s) => s.clearUnread);
  const setOtherRead = useChatStore((s) => s.setOtherRead);
  const setOtherOnline = useChatStore((s) => s.setOtherOnline);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const addReactionStore = useChatStore((s) => s.addReaction);
  const removeReactionStore = useChatStore((s) => s.removeReaction);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [replyTo, setReplyTo] = useState<MessagePublic | null>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendRef = useRef(send);
  const decryptMessagesRef = useRef(decryptMessages);
  const sendChatMessageRef = useRef<(content: string) => void>(() => {});

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    decryptMessagesRef.current = decryptMessages;
  }, [decryptMessages]);

  useEffect(() => {
    setActiveConversation(conversationId);
    clearUnread(conversationId);
    sendRef.current({ type: "subscribe", conversationId });

    return () => {
      sendRef.current({ type: "unsubscribe", conversationId });
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation, clearUnread]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [convData, messagesData] = await Promise.all([
          fetchConversation(conversationId),
          fetchMessages(conversationId),
        ]);

        if (cancelled) return;

        upsertConversation(convData.conversation);
        const decrypted = await decryptMessagesRef.current(messagesData.messages);
        setMessages(conversationId, decrypted);
        setOtherRead(conversationId, convData.otherReadMessageId);
        setOtherOnline(conversationId, convData.otherUserOnline);
        setHasMore(messagesData.hasMore);
        setNextCursor(messagesData.nextCursor);

        const last = messagesData.messages.at(-1);
        if (last) {
          await markConversationRead(conversationId, last.id);
          sendRef.current({
            type: "message:read",
            conversationId,
            messageId: last.id,
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [conversationId, setMessages, setOtherRead, setOtherOnline, upsertConversation]);

  useEffect(() => {
    if (conversation?.encryptionMode !== "e2e" || !e2eReady) return;
    const needsDecrypt = messages.some(
      (m) => m.encrypted || isEncryptedPayload(m.content),
    );
    if (!needsDecrypt) return;

    let cancelled = false;
    void decryptMessages(messages).then((decrypted) => {
      if (cancelled) return;
      const stillEncrypted = decrypted.some(
        (m) => m.encrypted || isEncryptedPayload(m.content),
      );
      if (stillEncrypted) return;
      setMessages(conversationId, decrypted);
    });

    return () => {
      cancelled = true;
    };
  }, [
    messages,
    conversation?.encryptionMode,
    e2eReady,
    conversationId,
    decryptMessages,
    setMessages,
  ]);

  const replaceOptimistic = useCallback(
    (optimisticId: string, message: MessagePublic) => {
      const current =
        useChatStore.getState().messagesByConversation[conversationId] ?? EMPTY_MESSAGES;
      const withoutTemp = current.filter((m) => m.id !== optimisticId);
      if (!withoutTemp.some((m) => m.id === message.id)) {
        setMessages(conversationId, [...withoutTemp, message]);
      } else {
        setMessages(conversationId, withoutTemp);
      }
    },
    [conversationId, setMessages],
  );

  const dropOptimistic = useCallback(
    (optimisticId: string) => {
      setMessages(
        conversationId,
        (useChatStore.getState().messagesByConversation[conversationId] ?? EMPTY_MESSAGES)
          .filter((m) => m.id !== optimisticId),
      );
    },
    [conversationId, setMessages],
  );

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchMessages(conversationId, nextCursor);
      prependMessages(conversationId, data.messages);
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, nextCursor, isLoadingMore, prependMessages]);

  const sendChatMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isSending || !user) return;
      setIsSending(true);

      const replySnapshot = replyTo;
      const optimisticId = `temp-${Date.now()}`;
      const optimistic = buildOptimisticMessage(
        conversationId,
        user,
        {
          content: content.trim(),
          contentType: "text",
          replyToId: replySnapshot?.id ?? null,
          replyTo: replySnapshot
            ? {
                id: replySnapshot.id,
                content: replySnapshot.content,
                contentType: replySnapshot.contentType,
                senderId: replySnapshot.senderId,
                sender: replySnapshot.sender,
              }
            : null,
        },
        optimisticId,
      );

      addMessage(optimistic);
      setReplyTo(null);

      try {
        const { content: payload, encrypted } = await encryptIfNeeded(
          content.trim(),
        );
        const message = await sendMessageApi(conversationId, {
          content: payload,
          contentType: "text",
          replyToId: replySnapshot?.id,
          encrypted,
        });
        const decrypted = await decryptMessages([message]);
        replaceOptimistic(optimisticId, decrypted[0] ?? message);
      } catch {
        dropOptimistic(optimisticId);
        toast("Gửi tin thất bại", "error", {
          label: "Thử lại",
          onClick: () => sendChatMessageRef.current(content),
        });
      } finally {
        setIsSending(false);
      }
    },
    [
      conversationId,
      isSending,
      user,
      replyTo,
      addMessage,
      replaceOptimistic,
      dropOptimistic,
      encryptIfNeeded,
      decryptMessages,
    ],
  );

  useEffect(() => {
    sendChatMessageRef.current = (content) => {
      void sendChatMessage(content);
    };
  }, [sendChatMessage]);

  const sendImage = useCallback(
    async (file: File) => {
      if (isSending || !user) return;
      setIsSending(true);
      setUploadProgress(0);

      const replySnapshot = replyTo;
      const optimisticId = `temp-${Date.now()}`;

      try {
        setUploadProgress(20);
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });

        setUploadProgress(50);
        const { url, thumbnailUrl } = await uploadMedia(
          compressed,
          "image",
          compressed.name || "photo.jpg",
        );

        const content = JSON.stringify({
          url,
          thumbnailUrl: thumbnailUrl ?? url,
        });

        const optimistic = buildOptimisticMessage(
          conversationId,
          user,
          {
            content,
            contentType: "image",
            replyToId: replySnapshot?.id ?? null,
            replyTo: replySnapshot
              ? {
                  id: replySnapshot.id,
                  content: replySnapshot.content,
                  contentType: replySnapshot.contentType,
                  senderId: replySnapshot.senderId,
                  sender: replySnapshot.sender,
                }
              : null,
          },
          optimisticId,
        );

        addMessage(optimistic);
        setReplyTo(null);
        setUploadProgress(80);

        const message = await sendMessageApi(conversationId, {
          content,
          contentType: "image",
          replyToId: replySnapshot?.id,
        });
        replaceOptimistic(optimisticId, message);
        setUploadProgress(100);
      } catch {
        dropOptimistic(optimisticId);
        toast("Gửi ảnh thất bại", "error");
      } finally {
        setIsSending(false);
        setTimeout(() => setUploadProgress(null), 400);
      }
    },
    [
      conversationId,
      isSending,
      user,
      replyTo,
      addMessage,
      replaceOptimistic,
      dropOptimistic,
    ],
  );

  const sendVoice = useCallback(
    async (blob: Blob, duration: number) => {
      if (isSending || !user) return;
      setIsSending(true);
      setUploadProgress(0);

      const replySnapshot = replyTo;
      const optimisticId = `temp-${Date.now()}`;

      try {
        setUploadProgress(30);
        const { url } = await uploadMedia(blob, "voice", "voice.webm");

        const content = JSON.stringify({ url, duration });

        const optimistic = buildOptimisticMessage(
          conversationId,
          user,
          {
            content,
            contentType: "voice",
            replyToId: replySnapshot?.id ?? null,
          },
          optimisticId,
        );

        addMessage(optimistic);
        setReplyTo(null);
        setUploadProgress(70);

        const message = await sendMessageApi(conversationId, {
          content,
          contentType: "voice",
          replyToId: replySnapshot?.id,
        });
        replaceOptimistic(optimisticId, message);
        setUploadProgress(100);
      } catch {
        dropOptimistic(optimisticId);
        toast("Gửi tin thoại thất bại", "error");
      } finally {
        setIsSending(false);
        setTimeout(() => setUploadProgress(null), 400);
      }
    },
    [
      conversationId,
      isSending,
      user,
      replyTo,
      addMessage,
      replaceOptimistic,
      dropOptimistic,
    ],
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!user) return;
      const message = messages.find((m) => m.id === messageId);
      const existing = message?.reactions?.find(
        (r) => r.userId === user.id && r.emoji === emoji,
      );

      try {
        if (existing) {
          removeReactionStore(conversationId, messageId, user.id, emoji);
          await removeReactionApi(messageId, emoji);
        } else {
          addReactionStore(conversationId, messageId, {
            emoji,
            userId: user.id,
            user: { id: user.id, displayName: user.displayName },
          });
          await addReactionApi(messageId, emoji);
        }
      } catch {
        if (existing) {
          addReactionStore(conversationId, messageId, existing);
        } else {
          removeReactionStore(conversationId, messageId, user.id, emoji);
        }
        toast("Không thể cập nhật reaction", "error");
      }
    },
    [
      user,
      messages,
      conversationId,
      addReactionStore,
      removeReactionStore,
    ],
  );

  const notifyTyping = useCallback(() => {
    send({ type: "typing:start", conversationId });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      send({ type: "typing:stop", conversationId });
    }, 2000);
  }, [conversationId, send]);

  const isMessageRead = useCallback(
    (message: MessagePublic) => {
      if (!otherReadMessageId || message.senderId !== user?.id) return false;
      const readIndex = messages.findIndex((m) => m.id === otherReadMessageId);
      const msgIndex = messages.findIndex((m) => m.id === message.id);
      return readIndex >= 0 && msgIndex >= 0 && msgIndex <= readIndex;
    },
    [messages, otherReadMessageId, user?.id],
  );

  return {
    conversation,
    messages,
    typingUsers,
    otherUserOnline,
    isLoading,
    isLoadingMore,
    hasMore,
    isSending,
    uploadProgress,
    replyTo,
    setReplyTo,
    e2eReady,
    decrypting,
    loadMore,
    sendMessage: sendChatMessage,
    sendImage,
    sendVoice,
    toggleReaction,
    notifyTyping,
    isMessageRead,
  };
}
