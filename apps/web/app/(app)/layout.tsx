import { AuthGuard } from "@/components/auth/auth-guard";
import { WebSocketProvider } from "@/components/chat/websocket-provider";
import { CallProvider } from "@/contexts/call-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <WebSocketProvider>
        <CallProvider>{children}</CallProvider>
      </WebSocketProvider>
    </AuthGuard>
  );
}
