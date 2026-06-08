import { AuthGuard } from "@/components/auth/auth-guard";
import { WebSocketProvider } from "@/components/chat/websocket-provider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <WebSocketProvider>{children}</WebSocketProvider>
    </AuthGuard>
  );
}
