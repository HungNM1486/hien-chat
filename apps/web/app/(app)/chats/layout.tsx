import { ChatSplitLayout } from "@/components/layout/chat-split-layout";

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatSplitLayout>{children}</ChatSplitLayout>;
}
