"use client";

import { useState } from "react";

export default function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="absolute right-2 top-4 rounded border border-line bg-surface px-2 py-0.5 font-mono text-[10px] tracking-[0.2em] text-ink-muted hover:text-ink"
    >
      {done ? "COPIED" : "COPY"}
    </button>
  );
}
