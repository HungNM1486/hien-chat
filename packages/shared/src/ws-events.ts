import type { MessagePublic, PresenceStatus } from "./schemas/chat.js";

export interface WebRtcSdp {
  type: "offer" | "answer" | "pranswer" | "rollback";
  sdp: string;
}

export interface WebRtcIceCandidate {
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

export type WsClientEvent =
  | { type: "subscribe"; conversationId: string }
  | { type: "unsubscribe"; conversationId: string }
  | { type: "typing:start"; conversationId: string }
  | { type: "typing:stop"; conversationId: string }
  | { type: "message:read"; conversationId: string; messageId: string }
  | { type: "ping" }
  | { type: "e2e:accept"; conversationId: string }
  | { type: "e2e:decline"; conversationId: string }
  | { type: "call:invite"; conversationId: string }
  | { type: "call:accept"; conversationId: string }
  | { type: "call:reject"; conversationId: string }
  | { type: "call:offer"; conversationId: string; sdp: WebRtcSdp }
  | { type: "call:answer"; conversationId: string; sdp: WebRtcSdp }
  | { type: "call:ice"; conversationId: string; candidate: WebRtcIceCandidate }
  | { type: "call:hangup"; conversationId: string };

export type WsServerEvent =
  | { type: "connected"; userId: string }
  | { type: "message:new"; message: MessagePublic }
  | { type: "message:edit"; message: MessagePublic }
  | { type: "message:delete"; messageId: string; conversationId: string }
  | { type: "typing:start"; conversationId: string; userId: string }
  | { type: "typing:stop"; conversationId: string; userId: string }
  | { type: "presence:update"; userId: string; status: PresenceStatus; lastSeen?: string }
  | { type: "read:update"; conversationId: string; userId: string; messageId: string }
  | { type: "reaction:add"; conversationId: string; messageId: string; reaction: { emoji: string; userId: string } }
  | { type: "reaction:remove"; conversationId: string; messageId: string; userId: string; emoji: string }
  | { type: "e2e:request"; conversationId: string; requesterId: string; requesterName: string }
  | { type: "e2e:enabled"; conversationId: string }
  | { type: "e2e:disabled"; conversationId: string }
  | { type: "conversation:update"; conversation: import("./schemas/chat.js").ConversationPublic }
  | { type: "call:incoming"; conversationId: string; callerId: string; callerName: string }
  | { type: "call:accepted"; conversationId: string; calleeId: string }
  | { type: "call:rejected"; conversationId: string; userId: string }
  | { type: "call:busy"; conversationId: string }
  | { type: "call:offer"; conversationId: string; fromUserId: string; sdp: WebRtcSdp }
  | { type: "call:answer"; conversationId: string; fromUserId: string; sdp: WebRtcSdp }
  | { type: "call:ice"; conversationId: string; fromUserId: string; candidate: WebRtcIceCandidate }
  | { type: "call:ended"; conversationId: string; userId: string; reason?: string }
  | { type: "pong" };
