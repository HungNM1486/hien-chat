"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
  }, []);

  return <InstallPrompt />;
}

function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-[390px] rounded-2xl border border-border bg-surface p-4 shadow-lg">
      <p className="mb-3 text-sm text-text-primary">
        Cài Hiên nhà lên màn hình để trải nghiệm như app native
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="flex-1 rounded-xl border border-border py-2 text-sm"
        >
          Để sau
        </button>
        <button
          type="button"
          onClick={() => {
            void deferred.prompt();
            setDismissed(true);
          }}
          className="flex-1 rounded-xl bg-primary py-2 text-sm text-on-primary"
        >
          Cài đặt
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-text-secondary">
        iOS: Share → Add to Home Screen
      </p>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}
