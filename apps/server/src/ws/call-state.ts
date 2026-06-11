export type CallSession = {
  conversationId: string;
  callerId: string;
  calleeId: string;
  state: "ringing" | "active";
  activeStartedAt: number | null;
};

const sessions = new Map<string, CallSession>();

function sessionKey(conversationId: string): string {
  return conversationId;
}

export function getCallSession(
  conversationId: string,
): CallSession | undefined {
  return sessions.get(sessionKey(conversationId));
}

export function isUserInCall(userId: string): boolean {
  for (const session of sessions.values()) {
    if (session.callerId === userId || session.calleeId === userId) {
      return true;
    }
  }
  return false;
}

export function startRinging(
  conversationId: string,
  callerId: string,
  calleeId: string,
): void {
  sessions.set(sessionKey(conversationId), {
    conversationId,
    callerId,
    calleeId,
    state: "ringing",
    activeStartedAt: null,
  });
}

export function markCallActive(conversationId: string): void {
  const session = sessions.get(sessionKey(conversationId));
  if (session) {
    session.state = "active";
    if (session.activeStartedAt == null) {
      session.activeStartedAt = Date.now();
    }
  }
}

export function getCallDurationSec(session: CallSession): number | null {
  if (session.activeStartedAt == null) return null;
  return Math.max(
    0,
    Math.floor((Date.now() - session.activeStartedAt) / 1000),
  );
}

export function endCall(conversationId: string): void {
  sessions.delete(sessionKey(conversationId));
}

export function endCallsForUser(userId: string): CallSession[] {
  const ended: CallSession[] = [];
  for (const [key, session] of sessions.entries()) {
    if (session.callerId === userId || session.calleeId === userId) {
      ended.push({ ...session });
      sessions.delete(key);
    }
  }
  return ended;
}

export function getCallsForUser(userId: string): CallSession[] {
  return [...sessions.values()].filter(
    (s) => s.callerId === userId || s.calleeId === userId,
  );
}
