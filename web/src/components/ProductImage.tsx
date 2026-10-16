"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}

const ABSOLUTE_URL = /^https?:\/\//i;

export default function ProductImage({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  className = "",
}: Props) {
  const [errored, setErrored] = useState(false);
  const isLocal = src.startsWith("/");
  const usable = !errored && src && (ABSOLUTE_URL.test(src) || isLocal);

  if (!usable) {
    return <div className={`bg-slate-100 ${className}`} aria-hidden="true" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setErrored(true)}
      className={className}
    />
  );
}
