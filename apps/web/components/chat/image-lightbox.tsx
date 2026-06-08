"use client";

import { XIcon } from "@phosphor-icons/react";
import { IconButton } from "@/components/ui/icon-button";

interface ImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

export function ImageLightbox({ url, onClose }: ImageLightboxProps) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/92 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Đóng"
      />
      <IconButton
        icon={XIcon}
        label="Đóng"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 bg-white/10 text-white hover:bg-white/20"
        style={{ top: "max(16px, var(--safe-area-top))" }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Ảnh phóng to"
        className="relative z-[1] max-h-[90vh] max-w-[95vw] object-contain shadow-2xl"
      />
    </div>
  );
}
