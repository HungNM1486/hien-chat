"use client";

interface ImageLightboxProps {
  url: string | null;
  onClose: () => void;
}

export function ImageLightbox({ url, onClose }: ImageLightboxProps) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95">
      <button
        type="button"
        className="absolute inset-0"
        onClick={onClose}
        aria-label="Đóng"
      />
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white"
        aria-label="Đóng"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Ảnh phóng to"
        className="relative z-[1] max-h-[90vh] max-w-[95vw] object-contain"
      />
    </div>
  );
}
