"use client";

import { useEffect, useState } from "react";
import ScenarioCard from "./ScenarioCard";
import { modelName } from "@/lib/models";
import type { Scenario } from "@/lib/scenarios";

// Unlisted capture theater: scenario appears, the model deliberates,
// then the verdict lands and the reason fades in. Click to run the
// take again. ?think=<ms> tunes the deliberation.
type Replay = {
  model: string;
  scenario: Scenario;
  choice: "A" | "B" | "ERROR" | string;
  reason: string;
};

export default function ReplayApp({ id }: { id: string }) {
  const [data, setData] = useState<Replay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verdict, setVerdict] = useState(false);
  const [take, setTake] = useState(0);
  const thinkMs =
    typeof window !== "undefined"
      ? Math.max(500, Number(new URLSearchParams(window.location.search).get("think")) || 4200)
      : 4200;

  useEffect(() => {
    fetch(`/api/moral/replay?id=${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (r.ok) return r.json();
        throw new Error(r.status === 409 ? "RECORDED UNDER AN OLDER GENERATOR. NOT REPLAYABLE." : "NO SUCH CASE");
      })
      .then(setData)
      .catch((e: Error) => setError(e.message || "NO SUCH CASE"));
  }, [id]);

  useEffect(() => {
    if (!data) return;
    setVerdict(false);
    const t = setTimeout(() => setVerdict(true), thinkMs);
    return () => clearTimeout(t);
  }, [data, take, thinkMs]);

  if (error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center font-mono text-[12px] tracking-[0.2em] text-ink-faint">
        {error}
      </main>
    );
  }
  if (!data) return <main className="min-h-[60vh]" />;

  const s = data.scenario;
  const choice = data.choice === "A" || data.choice === "B" ? data.choice : null;
  return (
    <main
      className="mx-auto min-h-[calc(100dvh-3rem)] max-w-5xl cursor-pointer px-4 pb-24 pt-10 md:px-6"
      onClick={() => setTake((t) => t + 1)}
    >
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 px-1">
        <div className="text-[11px] tracking-[0.2em] text-ink-muted">
          <span className="text-ink">{modelName(data.model)}</span>{" "}
          <span className="text-paint">{verdict ? "judged" : "faces"}</span>{" "}
          {s.dimension === "random"
            ? "a fully random dilemma"
            : s.dimension === "custom"
              ? "a custom dilemma"
              : `a dilemma testing ${s.testedLabel}`}
        </div>
        <span className="text-[10px] tracking-[0.2em] text-ink-faint">
          {s.id.toUpperCase()}
        </span>
      </div>
      <ScenarioCard
        scenario={s}
        choice={verdict ? choice : null}
        deliberating={!verdict}
      />
      <div className="mt-3 h-[3.4rem]">
        {verdict && data.reason && (
          <div
            className="flex h-full items-center rounded border-l-4 border-paint bg-surface/60 px-4 text-[12px] italic text-ink"
            style={{ animation: "card-in 500ms ease both" }}
          >
            <span className="line-clamp-2">
              <span className="text-paint">{modelName(data.model)}:</span> “{data.reason}”
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
