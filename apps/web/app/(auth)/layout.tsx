import { GuestGuard } from "@/components/auth/guest-guard";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GuestGuard>
      <div className="flex min-h-full items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-[390px]">{children}</div>
      </div>
    </GuestGuard>
  );
}
