"use client";

import { useRef, useState } from "react";
import ProductImage from "./ProductImage";
import ScrollReveal from "./ScrollReveal";
import type { ProductMedia } from "@/types/product";

interface Props {
  name: string;
  media: ProductMedia[];
  fallbackImage?: string | null;
  labels: { noImage: string; gallery: string; seriesReference: string; zoom?: string; close?: string };
}

export default function ProductMediaGallery({ name, media, fallbackImage, labels }: Props) {
  const primary = media.find(item => item.is_primary) ?? media[0];
  const images = primary ? [primary, ...media.filter(item => item.id !== primary.id)].filter(item => item.url) : fallbackImage ? [{ id: -1, url: fallbackImage, alt: name, caption: labels.seriesReference, kind: "reference" }] : [];
  const [selected, setSelected] = useState(0);
  const image = images[Math.min(selected, Math.max(0, images.length - 1))];
  const dialog = useRef<HTMLDialogElement>(null);
  return <ScrollReveal direction="left"><div className="product-gallery" onKeyDown={event => { if (images.length < 2 || !["ArrowLeft", "ArrowRight"].includes(event.key)) return; event.preventDefault(); setSelected(value => (value + (event.key === "ArrowRight" ? 1 : images.length - 1)) % images.length); }}>
    <div className="relative aspect-square overflow-hidden border border-[#dce1e5] bg-white">
      {image?.url ? <button type="button" onClick={() => dialog.current?.showModal()} aria-label={labels.zoom ?? "Enlarge product image"} className="product-gallery-main group absolute inset-0 cursor-zoom-in"><ProductImage key={image.url} src={image.url} alt={image.alt ?? name} sizes="(min-width:1024px) 480px, 100vw" className="object-contain p-7 transition-transform duration-500 group-hover:scale-[1.03] group-focus-visible:scale-[1.03]" priority /><span className="product-gallery-zoom absolute right-4 top-4 flex h-9 w-9 items-center justify-center border border-[#dce1e5] bg-white text-[#53606a]" aria-hidden="true"><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M8 21H3v-5M8 8l-5-5M16 8l5-5M16 16l5 5M8 16l-5 5" /></svg></span></button> : <div className="flex h-full items-center justify-center text-sm text-[#68747e]">{labels.noImage}</div>}
      {!primary && fallbackImage && <p className="pointer-events-none absolute bottom-0 left-0 right-0 border-t border-[#eef1f3] bg-white/95 px-4 py-3 text-[11px] text-[#68747e]">{labels.seriesReference}</p>}
    </div>
    {images.length > 1 && <div aria-label={labels.gallery} className="mt-4 grid grid-cols-4 gap-3">{images.map((item, index) => <button key={item.id} type="button" aria-pressed={selected === index} aria-label={`${labels.gallery} ${index + 1}`} onClick={() => setSelected(index)} className="product-thumbnail relative aspect-square border border-[#dce1e5] bg-white">{item.url && <ProductImage src={item.url} alt="" sizes="120px" className="object-contain p-2" />}</button>)}</div>}
    {image?.caption && primary && <p className="mt-3 text-xs leading-6 text-[#68747e]">{image.caption}</p>}
    <dialog ref={dialog} className="product-image-dialog fixed m-auto w-[min(1000px,94vw)] max-w-none border border-[#dce1e5] bg-white p-0" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} aria-label={labels.zoom ?? "Enlarge product image"}>
      <div className="flex items-center justify-between gap-5 border-b border-[#dce1e5] px-5 py-4"><p className="min-w-0 break-words text-sm font-semibold">{name}</p><button type="button" onClick={() => dialog.current?.close()} className="flex h-10 w-10 shrink-0 items-center justify-center text-2xl text-[#68747e] transition-colors hover:bg-[#f8f4f5] hover:text-[#af1728] focus-visible:bg-[#f8f4f5] focus-visible:text-[#af1728]" aria-label={labels.close ?? "Close image"}>×</button></div><div className="relative h-[min(70vh,720px)] bg-white">{image?.url && <ProductImage src={image.url} alt={image.alt ?? name} sizes="1000px" className="object-scale-down p-5 sm:p-10" />}</div>{!primary && fallbackImage && <p className="border-t border-[#dce1e5] px-5 py-3 text-xs text-[#68747e]">{labels.seriesReference}</p>}
    </dialog>
  </div></ScrollReveal>;
}
