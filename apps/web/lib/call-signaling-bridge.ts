import type { WsServerEvent } from "@hien-nha/shared";

type CallServerHandler = (event: WsServerEvent) => void | Promise<void>;

let handler: CallServerHandler | null = null;

export function registerCallServerHandler(h: CallServerHandler): () => void {
  handler = h;
  return () => {
    if (handler === h) handler = null;
  };
}

export function dispatchCallServerEvent(event: WsServerEvent): void {
  if (!event.type.startsWith("call:")) return;
  void handler?.(event);
}
