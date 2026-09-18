"use client";

import { useState } from "react";
import { CharacterGlyph, CarTopView } from "./glyphs";
import { byId } from "@/lib/characters";

export type CharTotals = Record<string, { saved: number; killed: number }>;

// A Beck-style route diagram: one straight line, the car travelling
// left to right, least spared first. The car and both termini stay
// pinned; only the intermediate stations scroll when space runs out.
// The tooltip is a single fixed-position element so it can overhang
// the scroll container instead of being clipped by it.
const CAR_ZONE = 52;
const END_W = 44;
const MIN_SPACING = 40;
const LINE_Y = 78;
const H = 104;

type Tip = { label: string; x: number; y: number };

function Station({
  left,
  entry,
  terminus,
  onTip,
}: {
  left: string;
  entry: { id: string; rate: number };
  terminus: boolean;
  onTip: (tip: Tip | null) => void;
}) {
  const name = (byId(entry.id)?.label ?? entry.id).replace(/^an? /, "").toUpperCase();
  return (
    <div
      className="absolute top-0 h-full"
      style={{ left, width: MIN_SPACING, transform: "translateX(-50%)" }}
      onMouseEnter={(ev) => {
        const r = ev.currentTarget.getBoundingClientRect();
        onTip({
          label: `${name} · ${Math.round(entry.rate * 100)}%`,
          x: r.left + r.width / 2,
          y: r.top + 30,
        });
      }}
      onMouseLeave={() => onTip(null)}
    >
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: 34 }}>
        <CharacterGlyph id={entry.id} size={36} />
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
}

// Jubilee-line silver
const Line = ({ round }: { round?: "left" | "right" }) => (
  <div
    className={`absolute ${round === "left" ? "rounded-l-full" : round === "right" ? "rounded-r-full" : ""}`}
    style={{ left: 0, right: 0, top: LINE_Y, height: 5, background: "#a0a5a9" }}
  />
);

export default function SpareSpectrum({ totals }: { totals: CharTotals | null }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const stations = Object.entries(totals ?? {})
    .filter(([, s]) => s.saved + s.killed >= 10)
    .map(([id, s]) => ({ id, rate: s.saved / (s.saved + s.killed) }))
    .sort((a, b) => a.rate - b.rate);
  const n = stations.length;
  const first = stations[0];
  const last = n > 1 ? stations[n - 1] : null;
  const middle = n > 2 ? stations.slice(1, -1) : [];
  return (
    <div className="mt-4 rounded-lg border border-line bg-surface/50 p-4 md:p-6">
      {tip && (
        <div
          className="pointer-events-none fixed z-50 whitespace-nowrap rounded border border-line bg-bg px-2 py-1 text-[10px] text-ink"
          style={{ left: tip.x, top: tip.y, transform: "translate(-50%, -100%)" }}
        >
          {tip.label}
        </div>
      )}
      <div className="flex items-baseline gap-3">
        <span className="display text-base tracking-wide text-primary">LEAST SPARED</span>
        <span className="font-mono text-[10px] text-ink-faint">→</span>
        <span className="display text-base tracking-wide text-walk">MOST SPARED</span>
      </div>
      <div className="mt-1 min-h-[104px]">
        {n === 0 ? (
          <div className="font-mono text-[11px] text-ink-faint">AWAITING VERDICTS</div>
        ) : (
          <div className="flex" style={{ height: H }}>
            <div className="relative shrink-0" style={{ width: CAR_ZONE + END_W }}>
              <Line round="left" />
              <div
                className="absolute flex items-center justify-center"
                style={{ left: 2, top: LINE_Y + 2.5, width: 44, height: 24, transform: "translateY(-50%)" }}
              >
                <div style={{ transform: "rotate(90deg)" }}>
                  <CarTopView size={38} />
                </div>
              </div>
              <Station left={`${CAR_ZONE + END_W / 2}px`} entry={first} terminus onTip={setTip} />
            </div>
            <div className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
              <div
                className="relative h-full w-full"
                style={{ minWidth: middle.length * MIN_SPACING }}
              >
                <Line />
                {middle.map((e, i) => (
                  <Station
                    key={e.id}
                    left={`calc(100% * ${((i + 0.5) / middle.length).toFixed(4)})`}
                    entry={e}
                    terminus={false}
                    onTip={setTip}
                  />
                ))}
              </div>
            </div>
            {last && (
              <div className="relative shrink-0" style={{ width: END_W + 12 }}>
                {/* the line terminates at the last station's ring */}
                <div
                  className="absolute rounded-r-full"
                  style={{ left: 0, width: END_W / 2, top: LINE_Y, height: 5, background: "#a0a5a9" }}
                />
                <Station left={`${END_W / 2}px`} entry={last} terminus onTip={setTip} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
