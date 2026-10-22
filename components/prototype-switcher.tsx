"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const variants = ["A", "B", "C"];
const defaultNames = ["Challenge first", "Trail + chat", "Conversation first"];

export default function PrototypeSwitcher({ names = defaultNames }: { names?: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const key = params.get("variant") ?? "B";
  const index = Math.max(0, variants.indexOf(key));

  useEffect(() => {
    function cycle(event: KeyboardEvent) {
      if (process.env.NODE_ENV === "production") return;
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable], [role='tablist'], [role='menu'], [role='dialog']")) return;
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const next = (index + (event.key === "ArrowRight" ? 1 : -1) + 3) % 3;
      const url = new URL(window.location.href);
      url.searchParams.set("variant", variants[next]);
      router.replace(url.pathname + url.search, { scroll: false });
    }
    window.addEventListener("keydown", cycle);
    return () => window.removeEventListener("keydown", cycle);
  }, [index, router]);

  if (process.env.NODE_ENV === "production") return null;
  function change(offset: number) {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", variants[(index + offset + 3) % 3]);
    router.replace(url.pathname + url.search, { scroll: false });
  }
  return (
    <aside aria-label="Prototype variations" data-prototype-switcher>
      <button aria-label="Previous variation" onClick={() => change(-1)}>←</button>
      <span><small>THROWAWAY PROTOTYPE · {index + 1}/3</small><strong>{variants[index]} · {names[index]}</strong></span>
      <button aria-label="Next variation" onClick={() => change(1)}>→</button>
    </aside>
  );
}
