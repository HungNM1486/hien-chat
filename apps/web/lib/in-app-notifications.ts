import type { MessagePublic } from "@hien-nha/shared";
import { getMessagePreview } from "@hien-nha/shared";
import { useNotificationBannerStore } from "@/stores/notification-banner-store";
import { useNotificationStore } from "@/stores/notification-store";
import { toast } from "@/stores/toast-store";
import { playMessageSound } from "@/lib/notification-sounds";
import { showSystemNotification } from "@/lib/system-notification";

interface NotifyMessageOptions {
  message: MessagePublic;
  conversationName?: string;
  currentUserId: string;
  activeConversationId: string | null;
}

function buildTitle(message: MessagePublic, conversationName?: string): string {
  const sender = message.sender?.displayName;
  if (sender) return sender;
  return conversationName ?? "Tin nhắn mới";
}

function buildBody(message: MessagePublic, conversationName?: string): string {
  const preview = getMessagePreview(message);
  if (conversationName && message.sender?.displayName) {
    return `${message.sender.displayName}: ${preview}`;
  }
  return preview;
}

export function notifyIncomingMessage({
  message,
  conversationName,
  currentUserId,
  activeConversationId,
}: NotifyMessageOptions): void {
  if (message.senderId === currentUserId) return;
  if (activeConversationId === message.conversationId) return;

  const prefs = useNotificationStore.getState();
  const title = buildTitle(message, conversationName);
  const body = buildBody(message, conversationName);
  const href = `/chats/${message.conversationId}`;

  useNotificationBannerStore.getState().show({
    kind: "message",
    title,
    body,
    href,
  });

  if (prefs.inAppToast) {
    toast(body, "info", {
      label: "Xem",
      onClick: () => {
        window.location.href = href;
      },
    });
  }

  if (prefs.messageSound) {
    playMessageSound();
  }

  if (prefs.desktopNotify) {
    showSystemNotification({
      title,
      body,
      tag: `message-${message.conversationId}`,
      href,
    });
  }
}

export function notifyIncomingCall(
  callerName: string,
  conversationId: string,
): void {
  const prefs = useNotificationStore.getState();
  const title = "Cuộc gọi đến";
  const body = `${callerName} đang gọi bạn`;
  const href = `/chats/${conversationId}`;

  useNotificationBannerStore.getState().show({
    kind: "call",
    title,
    body,
    href,
  });

  if (prefs.desktopNotify) {
    showSystemNotification({
      title,
      body,
      tag: `call-${conversationId}`,
      href,
      requireInteraction: true,
    });
  }
}
