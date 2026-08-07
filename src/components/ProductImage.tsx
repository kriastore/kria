"use client";

import Image from "next/image";
import React from "react";

export type ProductImageSize = "thumb" | "medium" | "full";

interface ProductImageProps {
  src?: string;
  srcMedium?: string;
  srcThumb?: string;
  size?: ProductImageSize;
  objectFit?: "cover" | "contain";
  sizes?: string;
  quality?: number;
  fallback?: string;
  alt?: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
  onClick?: () => void;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  onLoad?: () => void;
}

const FALLBACK = "/placeholder.png";

const SIZE_DEFAULTS: Record<ProductImageSize, string> = {
  thumb: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  medium: "(max-width: 1024px) 100vw, 50vw",
  full: "100vw",
};

const OBJECT_CLASS: Record<ProductImageSize, string> = {
  thumb: "object-cover",
  medium: "object-contain",
  full: "object-contain",
};

export default function ProductImage({
  src,
  srcMedium,
  srcThumb,
  size = "full",
  objectFit,
  sizes,
  quality,
  fallback = FALLBACK,
  alt = "",
  className,
  priority = false,
  fill = true,
  width,
  height,
  onClick,
  onError,
  onLoad,
}: ProductImageProps) {
  const resolveUrl = () => {
    if (size === "thumb") return srcThumb || srcMedium || src || fallback;
    if (size === "medium") return srcMedium || src || fallback;
    return src || fallback;
  };

  const thumbBackground = size !== "thumb" && srcThumb
    ? { backgroundImage: `url(${srcThumb})`, backgroundSize: "cover" as const, backgroundPosition: "center" as const }
    : undefined;

  if (fill) {
    return (
      <div className={`relative ${className || ""}`} onClick={onClick} style={thumbBackground}>
        <Image
          src={resolveUrl()}
          alt={alt}
          fill
          sizes={sizes || SIZE_DEFAULTS[size]}
          quality={quality}
          priority={priority}
          className={objectFit || OBJECT_CLASS[size]}
          onError={onError}
        />
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className || ""}`} onClick={onClick} style={thumbBackground}>
      <Image
        src={resolveUrl()}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes || SIZE_DEFAULTS[size]}
        quality={quality}
        priority={priority}
        className=""
        onClick={onClick}
        onError={onError}
      />
    </div>
  );
}
