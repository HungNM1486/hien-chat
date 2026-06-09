import { AuthGuard } from "@/components/auth/auth-guard";
import { WebSocketProvider } from "@/components/chat/websocket-provider";
import { NotificationProvider } from "@/components/notifications/notification-provider";
import { CallProvider } from "@/contexts/call-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <NotificationProvider>
        <WebSocketProvider>
          <CallProvider>{children}</CallProvider>
        </WebSocketProvider>
      </NotificationProvider>
    </AuthGuard>
  );
}
