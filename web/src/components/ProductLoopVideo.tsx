"use client";

import { useEffect, useRef, useState } from "react";
import ProductImage from "@/components/ProductImage";
import type { Lang } from "@/lib/lang";

export default function ProductLoopVideo({ lang }: { lang: Lang }) {
  const frame = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [motionAllowed, setMotionAllowed] = useState(false);
  const [failed, setFailed] = useState(false);
  const zh = lang === "zh";
  const poster = "/images/marketing/push-snap-video-poster.jpg";

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setMotionAllowed(!motion.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    const observer = new IntersectionObserver(([entry]) => {
      setInView(entry.isIntersecting);
      if (entry.isIntersecting) setLoaded(true);
    }, { threshold: 0.15 });
    if (frame.current) observer.observe(frame.current);
    return () => {
      observer.disconnect();
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const element = video.current;
    if (!element || failed) return;
    if (loaded && inView && pageVisible && motionAllowed) {
      element.muted = true;
      void element.play().catch(() => {});
    } else {
      element.pause();
    }
  }, [loaded, inView, pageVisible, motionAllowed, failed]);

  return (
    <div ref={frame} className="relative aspect-[16/10] overflow-hidden bg-white">
      {failed ? <ProductImage src={poster} alt={zh ? "PUSH-SNAP 接线演示" : "PUSH-SNAP connection demonstration"} className="object-contain" /> : <video
        ref={video}
        src={loaded ? "/videos/push-snap-loop.mp4" : undefined}
        poster={poster}
        muted
        loop
        playsInline
        preload="none"
        aria-label={zh ? "PUSH-SNAP 接线过程演示，静音循环" : "PUSH-SNAP connection demonstration, silent loop"}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-contain"
      />}
    </div>
  );
}
