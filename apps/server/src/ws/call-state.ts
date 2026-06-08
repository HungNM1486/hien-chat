type CallSession = {
  conversationId: string;
  callerId: string;
  calleeId: string;
  state: "ringing" | "active";
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
  });
}

export function markCallActive(conversationId: string): void {
  const session = sessions.get(sessionKey(conversationId));
  if (session) session.state = "active";
}

export function endCall(conversationId: string): void {
  sessions.delete(sessionKey(conversationId));
}

export function endCallsForUser(userId: string): string[] {
  const ended: string[] = [];
  for (const [key, session] of sessions.entries()) {
    if (session.callerId === userId || session.calleeId === userId) {
      ended.push(session.conversationId);
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
