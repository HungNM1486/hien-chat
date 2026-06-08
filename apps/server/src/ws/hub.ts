import type { WebSocket } from "ws";
import type { WsServerEvent } from "@hien-nha/shared";

interface SocketMeta {
  userId: string;
  subscriptions: Set<string>;
}

class WsHub {
  private userSockets = new Map<string, Set<WebSocket>>();
  private socketMeta = new Map<WebSocket, SocketMeta>();
  private onlineUsers = new Set<string>();

  addConnection(userId: string, socket: WebSocket): void {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket);  
    this.socketMeta.set(socket, { userId, subscriptions: new Set() });
    this.onlineUsers.add(userId);
  }

  removeConnection(socket: WebSocket): void {
    const meta = this.socketMeta.get(socket);
    if (!meta) return;

    const sockets = this.userSockets.get(meta.userId);
    sockets?.delete(socket);
    if (sockets?.size === 0) {
      this.userSockets.delete(meta.userId);
      this.onlineUsers.delete(meta.userId);
    }

    this.socketMeta.delete(socket);
  }

  subscribe(socket: WebSocket, conversationId: string): void {
    const meta = this.socketMeta.get(socket);
    if (meta) meta.subscriptions.add(conversationId);
  }

  unsubscribe(socket: WebSocket, conversationId: string): void {
    const meta = this.socketMeta.get(socket);
    if (meta) meta.subscriptions.delete(conversationId);
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getOnlineUserIds(): string[] {
    return [...this.onlineUsers];
  }

  send(socket: WebSocket, event: WsServerEvent): void {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify(event));
    }
  }

  sendToUser(userId: string, event: WsServerEvent): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    for (const socket of sockets) {
      this.send(socket, event);
    }
  }

  broadcastToConversation(
    conversationId: string,
    event: WsServerEvent,
    excludeUserId?: string,
  ): void {
    for (const [socket, meta] of this.socketMeta) {
      if (!meta.subscriptions.has(conversationId)) continue;
      if (excludeUserId && meta.userId === excludeUserId) continue;
      this.send(socket, event);
    }
  }

  broadcastPresence(userId: string, status: "online" | "offline"): void {
    const event: WsServerEvent = {
      type: "presence:update",
      userId,
      status,
      lastSeen: status === "offline" ? new Date().toISOString() : undefined,
    };

    for (const [socket, meta] of this.socketMeta) {
      if (meta.userId === userId) continue;
      this.send(socket, event);
    }
  }
}

export const wsHub = new WsHub();
