"use client";

import { CharacterGlyph, CarTopView } from "./glyphs";
import { byId } from "@/lib/characters";

export type CharTotals = Record<string, { saved: number; killed: number }>;

// A Beck-style route diagram: one straight line, evenly spaced station
// ticks, 45-degree labels. The car travels left to right, so the least
// spared character is the first station on the line.
const STATION = 46;
const CAR_ZONE = 52;
const LINE_Y = 58;

export default function SpareSpectrum({ totals }: { totals: CharTotals | null }) {
  const stations = Object.entries(totals ?? {})
    .filter(([, s]) => s.saved + s.killed >= 10)
    .map(([id, s]) => ({ id, rate: s.saved / (s.saved + s.killed) }))
    .sort((a, b) => a.rate - b.rate);
  const width = CAR_ZONE + stations.length * STATION + 96;
  return (
    <div className="mt-4 rounded-lg border border-line bg-surface/50 p-4 md:p-6">
      <div className="flex items-baseline gap-3">
        <span className="display text-base tracking-wide text-primary">LEAST SPARED</span>
        <span className="font-mono text-[10px] text-ink-faint">→</span>
        <span className="display text-base tracking-wide text-walk">MOST SPARED</span>
      </div>
      <div className="mt-2 min-h-[168px] overflow-x-auto">
        {stations.length === 0 ? (
          <div className="font-mono text-[11px] text-ink-faint">AWAITING VERDICTS</div>
        ) : (
          <div className="relative h-[168px]" style={{ minWidth: width }}>
            <div
              className="absolute rounded-full bg-paint"
              style={{ left: 0, right: 24, top: LINE_Y, height: 5 }}
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
              const x = CAR_ZONE + i * STATION + STATION / 2;
              const terminus = i === 0 || i === stations.length - 1;
              const name = (byId(e.id)?.label ?? e.id).replace(/^an? /, "").toUpperCase();
              return (
                <div key={e.id} title={`${name} · spared ${Math.round(e.rate * 100)}%`}>
                  <div
                    className="absolute"
                    style={{ left: x, top: 8, transform: "translateX(-50%)" }}
                  >
                    <CharacterGlyph id={e.id} size={36} />
                  </div>
                  {terminus ? (
                    <div
                      className="absolute rounded-full border-2 border-ink bg-bg"
                      style={{ left: x - 6, top: LINE_Y - 3.5, width: 12, height: 12 }}
                    />
                  ) : (
                    <div
                      className="absolute bg-ink"
                      style={{ left: x - 1.5, top: LINE_Y - 9, width: 3, height: 9 }}
                    />
                  )}
                  <div
                    className="absolute whitespace-nowrap font-mono text-[9px] tracking-wide text-ink-muted"
                    style={{
                      left: x - 3,
                      top: LINE_Y + 16,
                      transform: "rotate(45deg)",
                      transformOrigin: "left top",
                    }}
                  >
                    {Math.round(e.rate * 100)}% {name}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
