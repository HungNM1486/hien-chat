import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-background px-6 text-center">
      <p className="mb-2 text-4xl">📡</p>
      <h1 className="mb-2 text-xl font-semibold">Mất kết nối</h1>
      <p className="mb-6 text-sm text-text-secondary">
        Tin sẽ gửi khi có mạng trở lại
      </p>
      <Link
        href="/chats"
        className="rounded-xl bg-primary px-6 py-3 text-on-primary"
      >
        Thử lại
      </Link>
    </div>
  );
}
