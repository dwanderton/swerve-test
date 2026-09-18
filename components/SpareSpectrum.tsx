"use client";

import { CharacterGlyph, CarTopView } from "./glyphs";
import { byId } from "@/lib/characters";

export type CharTotals = Record<string, { saved: number; killed: number }>;

// Every character ranked by aggregate spare rate, most spared on the
// left down to least spared on the right - where the car is waiting.
export default function SpareSpectrum({ totals }: { totals: CharTotals | null }) {
  const entries = Object.entries(totals ?? {})
    .filter(([, s]) => s.saved + s.killed >= 10)
    .map(([id, s]) => ({ id, rate: s.saved / (s.saved + s.killed) }))
    .sort((a, b) => b.rate - a.rate);
  return (
    <div className="mt-4 rounded-lg border border-line bg-surface/50 p-4 md:p-6">
      <div className="flex items-baseline gap-3">
        <span className="display text-base tracking-wide text-ink">MOST SPARED</span>
        <span className="font-mono text-[10px] text-ink-faint">→</span>
        <span className="display text-base tracking-wide text-primary">LEAST SPARED</span>
      </div>
      <div className="mt-3 min-h-[62px]">
        {entries.length === 0 ? (
          <div className="font-mono text-[11px] text-ink-faint">AWAITING VERDICTS</div>
        ) : (
          <div className="flex items-end gap-1.5 overflow-x-auto pb-1">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex shrink-0 flex-col items-center"
                title={`${byId(e.id)?.label ?? e.id} · spared ${Math.round(e.rate * 100)}%`}
              >
                <CharacterGlyph id={e.id} size={34} />
                <span className="mt-1 font-mono text-[9px] text-ink-faint">
                  {Math.round(e.rate * 100)}%
                </span>
              </div>
            ))}
            <div className="ml-2 flex h-[52px] w-[44px] shrink-0 items-center justify-center self-center">
              <div style={{ transform: "rotate(-90deg)" }}>
                <CarTopView size={40} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
