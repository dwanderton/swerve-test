"use client";

import { useCallback, useEffect, useState } from "react";
import { MODELS } from "@/lib/models";

export function usePoll<T>(url: string, ms = 1_500) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (alive && res.ok) setData(await res.json());
      } catch {
        // retry next tick
      }
    };
    poll();
    const iv = setInterval(poll, ms);
    return () => {
      alive = false;
      clearInterval(iv);
    };
  }, [url, ms]);
  const act = useCallback(
    async (body: Record<string, unknown>) => {
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) setData(await res.json());
      } catch {
        // next poll recovers
      }
    },
    [url],
  );
  return { data, act };
}

export function ModelSelect({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10px] tracking-[0.22em] text-ink-faint">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-line bg-bg px-2 py-1.5 font-mono text-[11px] text-ink outline-none"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Btn({
  onClick,
  children,
  tone = "normal",
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  tone?: "normal" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-4 py-1.5 font-mono text-[11px] tracking-[0.22em] transition-colors disabled:opacity-40 ${
        tone === "danger"
          ? "border-primary/60 text-primary hover:bg-primary/15"
          : "border-line text-ink-muted hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-line bg-surface/60 p-4 ${className}`}>
      <div className="font-mono text-[10px] tracking-[0.28em] text-ink-faint">{title}</div>
      <div className="mt-3">{children}</div>
    </div>
  );
}
