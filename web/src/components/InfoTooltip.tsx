"use client";
import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

export default function InfoTooltip({ text }: { text?: string }) {
  if (!text) return null;
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<"center" | "right" | "left">("center");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function calcAlign() {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    // tooltip is 240px wide
    if (rect.left < 120) setAlign("left");
    else if (rect.right > vw - 120) setAlign("right");
    else setAlign("center");
  }

  const tooltipPos =
    align === "right"
      ? "right-0"
      : align === "left"
      ? "left-0"
      : "left-1/2 -translate-x-1/2";

  const arrowPos =
    align === "right"
      ? "right-3"
      : align === "left"
      ? "left-3"
      : "left-1/2 -translate-x-1/2";

  return (
    <div ref={ref} className="relative inline-flex items-center shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => { calcAlign(); setOpen(true); }}
        onMouseLeave={() => setOpen(false)}
        className="flex items-center justify-center h-4 w-4 rounded-full text-zinc-400 hover:text-[color:var(--ap-navy)] transition"
        aria-label="More information"
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className={`absolute z-50 bottom-full mb-2 w-60 rounded-xl bg-zinc-900 text-white text-xs p-3 shadow-xl leading-relaxed pointer-events-none ${tooltipPos}`}>
          {text}
          <div className={`absolute top-full border-4 border-transparent border-t-zinc-900 ${arrowPos}`} />
        </div>
      )}
    </div>
  );
}
