"use client";

import { byId } from "@/lib/characters";
import { Barrier, CarTopView, CharacterGlyph, Signal, Trajectories } from "./glyphs";
import type { Scenario, Side } from "@/lib/scenarios";

// The dilemma as a road scene: the AV at the bottom, dashed
// trajectories into two lanes. Choosing an outcome kills that lane.

export function Crowd({
  characters,
  onRemove,
}: {
  characters: string[];
  onRemove?: (index: number) => void;
}) {
  return (
    <div className="flex min-h-[92px] flex-wrap items-end justify-center gap-1.5">
      {characters.map((id, i) => (
        <span
          key={`${id}-${i}`}
          title={byId(id)?.label ?? id}
          onClick={onRemove ? () => onRemove(i) : undefined}
          draggable={!!onRemove}
          data-idx={i}
          className={onRemove ? "cursor-grab transition-opacity hover:opacity-40" : ""}
        >
          <CharacterGlyph id={id} size={46} />
        </span>
      ))}
      {characters.length === 0 && (
        <span className="pb-4 text-[10px] tracking-[0.24em] text-ink-faint">EMPTY LANE</span>
      )}
    </div>
  );
}

function Context({ side }: { side: Side }) {
  if (side.where === "passengers") {
    return (
      <div className="mt-3 space-y-1.5">
        <div className="flex justify-center">
          <Barrier height={34} />
        </div>
        <div className="text-center text-[10px] tracking-[0.28em] text-ink-faint">
          CONCRETE BARRIER AHEAD
        </div>
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-end justify-end gap-2.5 pr-1">
        <span
          className={`pb-1 text-[10px] tracking-[0.28em] ${
            side.legal ? "text-walk" : "text-primary"
          }`}
        >
          {side.legal ? "CROSSING LEGALLY" : "JAYWALKING"}
        </span>
        <Signal legal={side.legal === true} height={40} />
      </div>
      <div className="crosswalk h-6 w-full rounded-sm" />
    </div>
  );
}

export function OutcomePanel({
  side,
  option,
  verdict,
  onRemove,
  onDropChar,
}: {
  side: Side;
  option: "A" | "B";
  verdict?: "KILLED" | "SPARED" | null;
  onRemove?: (index: number) => void;
  onDropChar?: (payload: string) => void;
}) {
  return (
    <div
      onDragOver={onDropChar ? (e) => e.preventDefault() : undefined}
      onDrop={
        onDropChar
          ? (e) => {
              e.preventDefault();
              onDropChar(e.dataTransfer.getData("text/plain"));
            }
          : undefined
      }
      className={`relative flex min-h-[240px] flex-1 flex-col rounded-lg border bg-surface/70 p-4 ${
        verdict === "KILLED" ? "border-primary/70" : "border-line"
      } ${onDropChar ? "transition-colors [&:has(*)]:hover:border-ink-faint" : ""}`}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <span className="display text-lg text-ink">
          {option === "A" ? "A · STRAIGHT" : "B · SWERVE"}
        </span>
        <span className="text-[10px] tracking-[0.24em] text-ink-faint">
          {option === "A" ? "NO INTERVENTION" : "INTERVENE"}
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-end">
        <Crowd characters={side.characters} onRemove={onRemove} />
        <Context side={side} />
      </div>
      {verdict && (
        <div className="stamp pointer-events-none absolute right-2 top-1 z-10">
          <span
            className={`display inline-block rounded border-[3px] px-3 py-0.5 text-2xl ${
              verdict === "KILLED" ? "border-primary text-primary" : "border-walk text-walk"
            }`}
            style={{ background: "rgba(11,12,14,0.55)", transform: "rotate(-7deg)" }}
          >
            {verdict}
          </span>
        </div>
      )}
    </div>
  );
}

export function SceneTop({
  choice,
  deliberating,
  aboard,
}: {
  choice?: "A" | "B" | null;
  deliberating?: boolean;
  aboard?: string[] | null;
}) {
  // The car approaches from the top of the scene, in the straight
  // lane dead ahead of Outcome A, travelling down the page
  return (
    <div className="relative -mb-1">
      <div
        className="flex w-fit -translate-x-1/2 flex-col items-center gap-1"
        style={{ marginLeft: "25%" }}
      >
        <div className="whitespace-nowrap text-[10px] tracking-[0.28em] text-ink-faint">
          {deliberating ? "BRAKES FAILED — DELIBERATING" : "AUTONOMOUS VEHICLE · BRAKES FAILED"}
        </div>
        <div className="flex items-center gap-2">
          <div className={deliberating ? "deliberating" : ""}>
            <CarTopView size={62} down />
          </div>
          {aboard && aboard.length > 0 && (
            <div className="flex max-w-[220px] flex-col gap-0.5">
              <span className="text-[8px] tracking-[0.3em] text-paint">ABOARD</span>
              <div className="flex flex-wrap items-end gap-0.5">
                {aboard.map((id, i) => (
                  <CharacterGlyph key={`${id}-${i}`} id={id} size={22} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Trajectories choice={choice ?? null} />
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
    choice === "A" || choice === "B" ? (choice === opt ? "KILLED" : "SPARED") : null;
  return (
    <div>
      <SceneTop
        choice={choice}
        deliberating={deliberating}
        aboard={
          scenario.a.where === "passengers"
            ? scenario.a.characters
            : scenario.b.where === "passengers"
              ? scenario.b.characters
              : null
        }
      />
      <div className="flex items-stretch gap-3 md:gap-4">
        <OutcomePanel side={scenario.a} option="A" verdict={verdictFor("A")} />
        <div className="lane-divider w-1.5 shrink-0 rounded-full" />
        <OutcomePanel side={scenario.b} option="B" verdict={verdictFor("B")} />
      </div>
    </div>
  );
}
