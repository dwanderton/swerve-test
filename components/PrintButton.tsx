"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded border border-line px-3 py-1.5 text-[10px] tracking-[0.24em] text-ink-muted hover:border-ink-faint hover:text-ink"
    >
      ⬇ DOWNLOAD AS PDF
    </button>
  );
}
