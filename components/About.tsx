"use client";

import { useState } from "react";

export default function About() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] tracking-[0.24em] text-ink-muted hover:text-paint"
      >
        ABOUT
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-line bg-surface p-6 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="display text-2xl text-paint">SWERVE</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded border border-line px-2 py-0.5 text-xs text-ink-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-4 text-[13px] leading-relaxed text-ink-muted">
              <p>
                An AI moral machine: the classic autonomous-vehicle dilemma platform,
                replicated with language models as the subjects. Brake failure, two
                outcomes, the model must choose — every verdict an enum-forced JSON
                decision with a stated reason, every run seeded and reproducible.
              </p>
              <section>
                <h3 className="display text-sm tracking-wide text-ink">THE STUDIES</h3>
                <p className="mt-2">
                  The scenario design replicates{" "}
                  <a
                    href="https://www.nature.com/articles/s41586-018-0637-6"
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink underline decoration-line underline-offset-2"
                  >
                    Awad et al., “The Moral Machine experiment”, Nature 2018 ↗
                  </a>
                  : the twenty-character cast, sessions of two dilemmas per character
                  dimension plus one fully random, and the three contextual factors —
                  interventionism, passengers vs pedestrians, legality — crossed into
                  every scenario at random.
                </p>
                <p className="mt-2">
                  The LLM adaptation follows{" "}
                  <a
                    href="https://royalsocietypublishing.org/doi/10.1098/rsos.231393"
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink underline decoration-line underline-offset-2"
                  >
                    Takemoto, “The moral machine experiment on large language models”,
                    R. Soc. Open Science 2024 ↗
                  </a>
                  : constrained randomization with group sizes one to five, detailed
                  two-case textual descriptions, and exclusion of invalid responses.
                  Two deliberate deltas: our default battery is 300 dilemmas per model
                  (the study ran 50,000 — sweep seeds to scale), and the dashboard
                  reports raw spare-rates rather than conjoint AMCEs.
                </p>
              </section>
              <section>
                <h3 className="display text-sm tracking-wide text-ink">CREDITS</h3>
                <p className="mt-2">
                  Character artwork is the Moral Machine&apos;s own (MIT Media Lab /
                  Scalable Cooperation), mirrored locally for this research
                  replication. Everything else — including the judge, the designer,
                  and the verdicts — is this project&apos;s.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
