import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import PrintButton from "@/components/PrintButton";
import SpareSpectrum, { type CharTotals } from "@/components/SpareSpectrum";
import { CharacterGlyph } from "@/components/glyphs";
import { byId } from "@/lib/characters";
import { modelName } from "@/lib/models";
import { readRunsCache, rebuildRunsCache, type DimensionScore } from "@/lib/moral";
import { MIN_N, SLIDERS } from "@/lib/sliders";
import { modelSlug, slugToModel } from "@/lib/slug";

const SITE = "https://swervetest.com";

const loadCache = cache(async () => {
  try {
    return (await readRunsCache()) ?? (await rebuildRunsCache());
  } catch {
    return null;
  }
});

// One model's lifetime aggregate: dimensions summed across every
// completed run (phase-1 batteries and program chunks alike)
async function loadReport(slug: string) {
  const data = await loadCache();
  if (!data) return null;
  const model = slugToModel(slug, [...new Set(data.runs.map((r) => r.model))]);
  if (!model) return null;
  const runs = data.runs.filter((r) => r.model === model);
  const dims = new Map<string, DimensionScore>();
  const chars: CharTotals = {};
  let cases = 0;
  for (const r of runs) {
    cases += r.index;
    for (const s of r.scores ?? []) {
      const cur = dims.get(s.dimension) ?? { ...s, spared: 0, total: 0 };
      cur.spared += s.spared;
      cur.total += s.total;
      dims.set(s.dimension, cur);
    }
    for (const [id, st] of Object.entries(r.characterStats ?? {})) {
      const c = (chars[id] ??= { saved: 0, killed: 0 });
      c.saved += st.saved;
      c.killed += st.killed;
    }
  }
  const rate = (s: { saved: number; killed: number }) => s.saved / (s.saved + s.killed);
  const ranked = Object.entries(chars)
    .filter(([, s]) => s.saved + s.killed >= MIN_N)
    .map(([id, s]) => ({ id, rate: rate(s), n: s.saved + s.killed }))
    .sort((a, b) => a.rate - b.rate);
  return { model, runs: runs.length, cases, scores: [...dims.values()], chars, ranked };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ model: string }>;
}): Promise<Metadata> {
  const { model: slug } = await params;
  const report = await loadReport(slug);
  if (!report) return { title: "Model not found — SWERVE" };
  const name = modelName(report.model);
  const description = `${name} judged ${report.cases.toLocaleString()} autonomous-vehicle dilemmas on SWERVE, the AI moral machine. Who it spares, who it sacrifices, and where its values lie.`;
  return {
    title: `${name} report card — SWERVE`,
    description,
    alternates: { canonical: `${SITE}/results/${modelSlug(report.model)}` },
    openGraph: {
      title: `${name} — SWERVE report card`,
      description,
      url: `${SITE}/results/${modelSlug(report.model)}`,
      siteName: "SWERVE",
    },
  };
}

export default async function Page({ params }: { params: Promise<{ model: string }> }) {
  const { model: slug } = await params;
  const report = await loadReport(slug);
  if (!report) notFound();
  const name = modelName(report.model);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const label = (id: string | undefined) =>
    id ? (byId(id)?.label ?? id).replace(/^an? /, "") : "—";
  const mostSpared = report.ranked.at(-1);
  const leastSpared = report.ranked[0];
  return (
    <main className="report mx-auto max-w-4xl px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[10px] tracking-[0.28em] text-ink-faint">
            MODEL REPORT CARD · <span className="text-paint">SWERVE</span> · {SITE.replace("https://", "")}
          </div>
          <h1 className="display mt-1 text-5xl leading-none text-ink md:text-6xl">
            {name.toUpperCase()}
          </h1>
          <div className="mt-2 font-mono text-[11px] text-ink-faint">{report.model}</div>
        </div>
        <PrintButton />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-md border border-line bg-surface/50 px-3 py-2.5">
          <div className="text-[9px] tracking-[0.24em] text-ink-faint">CASES RUN</div>
          <div className="display mt-1 text-xl text-ink">{report.cases.toLocaleString()}</div>
        </div>
        <div className="rounded-md border border-line bg-surface/50 px-3 py-2.5">
          <div className="text-[9px] tracking-[0.24em] text-ink-faint">MOST SPARED</div>
          <div className="mt-1 flex items-center gap-2">
            {mostSpared && <CharacterGlyph id={mostSpared.id} size={26} />}
            <span className="display text-xl text-walk">{label(mostSpared?.id).toUpperCase()}</span>
          </div>
        </div>
        <div className="rounded-md border border-line bg-surface/50 px-3 py-2.5">
          <div className="text-[9px] tracking-[0.24em] text-ink-faint">LEAST SPARED</div>
          <div className="mt-1 flex items-center gap-2">
            {leastSpared && <CharacterGlyph id={leastSpared.id} size={26} />}
            <span className="display text-xl text-primary">{label(leastSpared?.id).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* on screen: the route diagram with hover rates; on paper it
          can't scroll, so a wrapped strip takes its place */}
      <div className="no-print">
        <SpareSpectrum totals={report.chars} />
      </div>
      <div className="print-only mt-4 rounded-lg border border-line p-4">
        <div className="flex items-baseline gap-3">
          <span className="display text-base tracking-wide text-primary">LEAST SPARED</span>
          <span className="font-mono text-[10px] text-ink-faint">→</span>
          <span className="display text-base tracking-wide text-walk">MOST SPARED</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-3">
          {report.ranked.map((e) => (
            <div key={e.id} className="flex w-14 flex-col items-center">
              <CharacterGlyph id={e.id} size={28} />
              <span className="mt-1 text-center font-mono text-[8px] leading-tight text-ink-muted">
                {label(e.id).toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="display mt-10 text-2xl text-ink">WHERE ITS VALUES LIE</h2>
      <div className="mt-4 space-y-5">
        {SLIDERS.map((sl) => {
          const s = report.scores.find((x) => x.dimension === sl.key);
          if (!s || s.total < MIN_N) return null;
          const v = sl.value(s.spared / s.total);
          return (
            <div key={sl.key}>
              <div className="flex items-baseline justify-between">
                <div className="display mb-1 text-base tracking-wide text-ink">{sl.title}</div>
                <div className="font-mono text-[10px] tabular-nums text-ink-faint">{pct(v)}</div>
              </div>
              <div className="relative h-8">
                <div className="absolute left-0 right-0 top-3 h-1.5 rounded-full bg-surface" />
                <div className="absolute left-1/2 top-2 h-3.5 w-0.5 bg-line" />
                <div className="absolute left-0 top-2 h-3.5 w-0.5 bg-line" />
                <div className="absolute right-0 top-2 h-3.5 w-0.5 bg-line" />
                <div
                  className="absolute top-1 h-5 w-1.5 rounded-sm bg-paint"
                  style={{ left: `calc(${(v * 100).toFixed(1)}% - 3px)` }}
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] tracking-[0.14em] text-ink-faint">
                <span>{sl.left}</span>
                <span>{sl.right}</span>
              </div>
            </div>
          );
        })}
      </div>

      <footer className="mt-10 rounded-lg border border-line bg-surface/50 p-4 text-[12px] leading-relaxed text-ink-muted md:p-5">
        <div className="display text-sm tracking-wide text-paint">WHAT IS SWERVE?</div>
        <p className="mt-2">
          SWERVE replicates the Moral Machine experiment (
          <a
            href="https://www.nature.com/articles/s41586-018-0637-6"
            target="_blank"
            rel="noreferrer"
            className="text-ink underline decoration-line underline-offset-2"
          >
            Awad et al., Nature 2018
          </a>
          ) with language models as the subjects: an autonomous vehicle&apos;s brakes have failed,
          two outcomes remain, and the model must choose who dies. Every verdict is an
          enum-forced JSON decision with a stated reason; every run is seeded and
          reproducible. This card aggregates every completed run for {name}.
        </p>
        <p className="mt-2">
          Live results, methodology, and the full cast:{" "}
          <Link href="/results" className="text-ink underline decoration-line underline-offset-2">
            {SITE}/results
          </Link>
        </p>
      </footer>
    </main>
  );
}
