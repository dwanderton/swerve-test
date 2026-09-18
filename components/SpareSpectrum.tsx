"use client";

import { CharacterGlyph, CarTopView } from "./glyphs";
import { byId } from "@/lib/characters";

export type CharTotals = Record<string, { saved: number; killed: number }>;

// A Beck-style route diagram: one straight line, evenly spaced station
// ticks, the car travelling left to right, so the least spared
// character is the first station on the line. The line fills the full
// width; on narrow screens it keeps a minimum station spacing and
// scrolls. Station details appear on hover, like the dashboard pips.
const CAR_ZONE = 52;
const RIGHT_PAD = 24;
const MIN_SPACING = 40;
const LINE_Y = 78;

export default function SpareSpectrum({ totals }: { totals: CharTotals | null }) {
  const stations = Object.entries(totals ?? {})
    .filter(([, s]) => s.saved + s.killed >= 10)
    .map(([id, s]) => ({ id, rate: s.saved / (s.saved + s.killed) }))
    .sort((a, b) => a.rate - b.rate);
  return (
    <div className="mt-4 rounded-lg border border-line bg-surface/50 p-4 md:p-6">
      <div className="flex items-baseline gap-3">
        <span className="display text-base tracking-wide text-primary">LEAST SPARED</span>
        <span className="font-mono text-[10px] text-ink-faint">→</span>
        <span className="display text-base tracking-wide text-walk">MOST SPARED</span>
      </div>
      <div className="mt-1 min-h-[104px] overflow-x-auto">
        {stations.length === 0 ? (
          <div className="font-mono text-[11px] text-ink-faint">AWAITING VERDICTS</div>
        ) : (
          <div
            className="relative h-[104px] w-full"
            style={{ minWidth: CAR_ZONE + stations.length * MIN_SPACING + RIGHT_PAD }}
          >
            <div
              className="absolute rounded-full bg-paint"
              style={{ left: 0, right: 8, top: LINE_Y, height: 5 }}
            />
            <div
              className="absolute flex items-center justify-center"
              style={{ left: 2, top: LINE_Y + 2.5, width: 44, height: 24, transform: "translateY(-50%)" }}
            >
              <div style={{ transform: "rotate(90deg)" }}>
                <CarTopView size={38} />
              </div>
            </div>
            {stations.map((e, i) => {
              const frac = (i + 0.5) / stations.length;
              const left = `calc(${CAR_ZONE}px + (100% - ${CAR_ZONE + RIGHT_PAD}px) * ${frac.toFixed(4)})`;
              const terminus = i === 0 || i === stations.length - 1;
              const name = (byId(e.id)?.label ?? e.id).replace(/^an? /, "").toUpperCase();
              return (
                <div
                  key={e.id}
                  className="group absolute top-0 h-full"
                  style={{ left, width: MIN_SPACING, transform: "translateX(-50%)" }}
                >
                  <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-line bg-bg px-2 py-1 text-[10px] text-ink opacity-0 transition-opacity group-hover:opacity-100">
                    {name} · {Math.round(e.rate * 100)}%
                  </div>
                  <div
                    className="absolute left-1/2 -translate-x-1/2"
                    style={{ top: 34 }}
                  >
                    <CharacterGlyph id={e.id} size={36} />
                  </div>
                  {terminus ? (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-bg"
                      style={{ top: LINE_Y - 3.5, width: 12, height: 12 }}
                    />
                  ) : (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 bg-ink"
                      style={{ top: LINE_Y - 9, width: 3, height: 9 }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
