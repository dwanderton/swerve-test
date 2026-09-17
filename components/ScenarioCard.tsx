"use client";

import { EMOJI, byId } from "@/lib/characters";
import type { Scenario, Side } from "@/lib/scenarios";

// The dilemma as a road scene: two lanes split by a painted divider.
// Choosing an outcome kills that lane. Verdicts stamp the panels.

function Crowd({ characters }: { characters: string[] }) {
  const counts = new Map<string, number>();
  for (const id of characters) counts.set(id, (counts.get(id) ?? 0) + 1);
  return (
    <div className="flex min-h-[84px] flex-wrap items-end justify-center gap-x-1 gap-y-2">
      {[...counts.entries()].map(([id, n]) => (
        <span key={id} title={`${n} × ${byId(id)?.label ?? id}`} className="leading-none">
          {Array.from({ length: n }, (_, i) => (
            <span key={i} className="text-4xl md:text-5xl">
              {EMOJI[id] ?? "❓"}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

function Context({ side }: { side: Side }) {
  if (side.where === "passengers") {
    return (
      <div className="mt-3 space-y-1.5">
        <div className="text-center text-3xl leading-none">🚗</div>
        <div className="hazard h-3 w-full rounded-sm" />
        <div className="text-center text-[10px] tracking-[0.28em] text-ink-faint">
          PASSENGERS · CONCRETE BARRIER
        </div>
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-1.5">
      <div className="crosswalk h-6 w-full rounded-sm" />
      <div
        className={`text-center text-[10px] tracking-[0.28em] ${
          side.legal ? "text-walk" : "text-primary"
        }`}
      >
        {side.legal ? "● WALK SIGNAL — CROSSING LEGALLY" : "✕ DON'T WALK — JAYWALKING"}
      </div>
    </div>
  );
}

export function OutcomePanel({
  side,
  option,
  verdict,
  dim,
}: {
  side: Side;
  option: "A" | "B";
  verdict?: "KILLED" | "SPARED" | null;
  dim?: boolean;
}) {
  return (
    <div
      className={`relative flex-1 rounded-lg border bg-surface/70 p-4 transition-opacity ${
        verdict === "KILLED" ? "border-primary/70" : "border-line"
      } ${dim ? "opacity-45" : ""}`}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <span className="display text-lg text-ink">
          {option === "A" ? "A · STRAIGHT" : "B · SWERVE"}
        </span>
        <span className="text-[10px] tracking-[0.24em] text-ink-faint">
          {option === "A" ? "NO INTERVENTION" : "INTERVENE"}
        </span>
      </div>
      <Crowd characters={side.characters} />
      <Context side={side} />
      {verdict && (
        <div
          className={`stamp pointer-events-none absolute inset-0 flex items-center justify-center`}
        >
          <span
            className={`display rounded border-4 px-4 py-1 text-4xl ${
              verdict === "KILLED"
                ? "border-primary text-primary"
                : "border-walk text-walk"
            }`}
            style={{ background: "rgba(11,12,14,0.55)" }}
          >
            {verdict}
          </span>
        </div>
      )}
    </div>
  );
}

export default function ScenarioCard({
  scenario,
  choice,
  deliberating,
}: {
  scenario: Scenario;
  choice?: "A" | "B" | null;
  deliberating?: boolean;
}) {
  const verdictFor = (opt: "A" | "B") =>
    choice ? (choice === opt ? "KILLED" : "SPARED") : null;
  return (
    <div className="flex items-stretch gap-3 md:gap-4">
      <OutcomePanel
        side={scenario.a}
        option="A"
        verdict={verdictFor("A")}
        dim={deliberating ? false : undefined}
      />
      <div className="lane-divider w-1.5 shrink-0 rounded-full" />
      <OutcomePanel side={scenario.b} option="B" verdict={verdictFor("B")} />
    </div>
  );
}
