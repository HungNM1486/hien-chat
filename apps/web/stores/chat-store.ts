"use client";

import { create } from "zustand";
import type {
  ConversationPublic,
  MessagePublic,
  MessageReaction,
  PresenceStatus,
} from "@hien-nha/shared";

/** Stable fallbacks — never use `?? []` inline in selectors (causes infinite re-renders). */
export const EMPTY_MESSAGES: MessagePublic[] = [];
export const EMPTY_TYPING_USERS: string[] = [];

interface ChatState {
  conversations: ConversationPublic[];
  messagesByConversation: Record<string, MessagePublic[]>;
  typingByConversation: Record<string, string[]>;
  presence: Record<string, { status: PresenceStatus; lastSeen?: string }>;
  otherReadByConversation: Record<string, string | null>;
  otherOnlineByConversation: Record<string, boolean>;
  activeConversationId: string | null;
  isLoadingConversations: boolean;

  setConversations: (conversations: ConversationPublic[]) => void;
  upsertConversation: (conversation: ConversationPublic) => void;
  setMessages: (conversationId: string, messages: MessagePublic[]) => void;
  prependMessages: (conversationId: string, messages: MessagePublic[]) => void;
  addMessage: (message: MessagePublic) => void;
  updateMessage: (message: MessagePublic) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  setTyping: (conversationId: string, userId: string, typing: boolean) => void;
  setPresence: (
    userId: string,
    status: PresenceStatus,
    lastSeen?: string,
  ) => void;
  setOtherRead: (conversationId: string, messageId: string | null) => void;
  setOtherOnline: (conversationId: string, online: boolean) => void;
  setActiveConversation: (id: string | null) => void;
  setLoadingConversations: (loading: boolean) => void;
  clearUnread: (conversationId: string) => void;
  addReaction: (
    conversationId: string,
    messageId: string,
    reaction: MessageReaction,
  ) => void;
  removeReaction: (
    conversationId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  messagesByConversation: {},
  typingByConversation: {},
  presence: {},
  otherReadByConversation: {},
  otherOnlineByConversation: {},
  activeConversationId: null,
  isLoadingConversations: false,

  setConversations: (conversations) => set({ conversations }),

  upsertConversation: (conversation) =>
    set((state) => {
      const idx = state.conversations.findIndex((c) => c.id === conversation.id);
      const next = [...state.conversations];
      if (idx >= 0) next[idx] = conversation;
      else next.unshift(conversation);
      next.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.createdAt;
        const bTime = b.lastMessage?.createdAt ?? b.createdAt;
        return bTime.localeCompare(aTime);
      });
      return { conversations: next };
    }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: messages,
      },
    })),

  prependMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [
          ...messages,
          ...(state.messagesByConversation[conversationId] ?? []),
        ],
      },
    })),

  addMessage: (message) =>
    set((state) => {
      const existing = state.messagesByConversation[message.conversationId] ?? [];
      if (existing.some((m) => m.id === message.id)) {
        return state;
      }

      const conversations = state.conversations.map((c) =>
        c.id === message.conversationId
          ? {
              ...c,
              lastMessage: message,
              unreadCount:
                state.activeConversationId === message.conversationId
                  ? 0
                  : c.unreadCount + 1,
            }
          : c,
      );

      conversations.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.createdAt;
        const bTime = b.lastMessage?.createdAt ?? b.createdAt;
        return bTime.localeCompare(aTime);
      });

      return {
        conversations,
        messagesByConversation: {
          ...state.messagesByConversation,
          [message.conversationId]: [...existing, message],
        },
      };
    }),

  updateMessage: (message) =>
    set((state) => {
      const list = state.messagesByConversation[message.conversationId] ?? [];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [message.conversationId]: list.map((m) =>
            m.id === message.id ? message : m,
          ),
        },
        conversations: state.conversations.map((c) =>
          c.id === message.conversationId && c.lastMessage?.id === message.id
            ? { ...c, lastMessage: message }
            : c,
        ),
      };
    }),

  removeMessage: (conversationId, messageId) =>
    set((state) => {
      const list = state.messagesByConversation[conversationId] ?? [];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: list.map((m) =>
            m.id === messageId
              ? { ...m, content: "Tin nhắn đã bị xóa", deletedAt: new Date().toISOString() }
              : m,
          ),
        },
      };
    }),

  setTyping: (conversationId, userId, typing) =>
    set((state) => {
      const current = state.typingByConversation[conversationId] ?? [];
      const next = typing
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return {
        typingByConversation: {
          ...state.typingByConversation,
          [conversationId]: next,
        },
      };
    }),

  setPresence: (userId, status, lastSeen) =>
    set((state) => ({
      presence: {
        ...state.presence,
        [userId]: { status, lastSeen },
      },
    })),

  setOtherRead: (conversationId, messageId) =>
    set((state) => {
      if (state.otherReadByConversation[conversationId] === messageId) {
        return state;
      }
      return {
        otherReadByConversation: {
          ...state.otherReadByConversation,
          [conversationId]: messageId,
        },
      };
    }),

  setOtherOnline: (conversationId, online) =>
    set((state) => {
      if (state.otherOnlineByConversation[conversationId] === online) {
        return state;
      }
      return {
        otherOnlineByConversation: {
          ...state.otherOnlineByConversation,
          [conversationId]: online,
        },
      };
    }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setLoadingConversations: (loading) =>
    set({ isLoadingConversations: loading }),

  clearUnread: (conversationId) =>
    set((state) => {
      const target = state.conversations.find((c) => c.id === conversationId);
      if (!target || target.unreadCount === 0) return state;
      return {
        conversations: state.conversations.map((c) =>
          c.id === conversationId ? { ...c, unreadCount: 0 } : c,
        ),
      };
    }),

  addReaction: (conversationId, messageId, reaction) =>
    set((state) => {
      const list = state.messagesByConversation[conversationId] ?? [];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: list.map((m) => {
            if (m.id !== messageId) return m;
            const reactions = m.reactions ?? [];
            if (reactions.some((r) => r.userId === reaction.userId && r.emoji === reaction.emoji)) {
              return m;
            }
            return { ...m, reactions: [...reactions, reaction] };
          }),
        },
      };
    }),

  removeReaction: (conversationId, messageId, userId, emoji) =>
    set((state) => {
      const list = state.messagesByConversation[conversationId] ?? [];
      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [conversationId]: list.map((m) => {
            if (m.id !== messageId) return m;
            return {
              ...m,
              reactions: (m.reactions ?? []).filter(
                (r) => !(r.userId === userId && r.emoji === emoji),
              ),
            };
          }),
        },
      };
    }),
}));
