"use client";

import { parseImageContent, type MessagePublic } from "@hien-nha/shared";
import { cn } from "@/lib/utils";

interface ImageBubbleProps {
  message: MessagePublic;
  onOpen: (url: string) => void;
}

export function ImageBubble({ message, onOpen }: ImageBubbleProps) {
  const image = parseImageContent(message.content);
  if (!image) {
    return (
      <p className="text-sm italic opacity-70">Không tải được ảnh</p>
    );
  }

  const src = image.thumbnailUrl ?? image.url;

  return (
    <button
      type="button"
      onClick={() => onOpen(image.url)}
      className={cn(
        "pressable block overflow-hidden rounded-xl",
        "ring-1 ring-black/10 transition-[transform,box-shadow] hover:shadow-lg",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Ảnh đính kèm"
        className="max-h-64 max-w-full object-cover"
        loading="lazy"
      />
    </button>
  );
}
