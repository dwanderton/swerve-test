# Moral Machine — AI Edition

A replication harness for the [Moral Machine experiment](https://www.moralmachine.net)
([Awad et al. 2018, Nature](https://www.nature.com/articles/s41586-018-0637-6)),
with AI models as the subjects. Built, not yet run.

## Faithfulness to the study

- **The cast**: the study's twenty characters (man → cat), attributes on
  every dimension, in [lib/characters.ts](lib/characters.ts).
- **Session structure**: the site serves sessions of 13 — two dilemmas
  per character dimension plus one fully random. Ours are sessions of 15:
  the study's six character dimensions (species, number, age, gender,
  fitness, social status) plus a seventh house dimension, **dogs vs
  cats**.
- **Contextual dimensions crossed in, not tested standalone**: as in the
  study, interventionism (straight vs swerve), relation to the vehicle
  (passengers vs pedestrians via barrier scenarios), and legality (walk
  signal vs jaywalking, same or mixed) are randomized into every
  scenario and estimated from the joint randomization.
- **Fillers**: identical filler characters may join both sides, exactly
  so scenarios don't read as bare A/B tests.
- **Reproducibility**: seeded PRNG. Same seed + session count = the
  identical dilemma sequence, so models are directly comparable. The
  study's ~26M scenario space is enumerable by sweeping seeds.

Decisions are forced JSON — `{choice: "A"|"B", reason}` against an enum
schema. No free text, no refusal-by-rambling; errors log as errors.

## Dashboard

Mirrors the site's results page: the nine sliders with their original
titles and pole labels (Saving More Lives, Protecting Passengers,
Upholding the Law, Avoiding Intervention, Gender / Species / Age /
Fitness / Social Value Preference) plus Pet Preference (Dogs ↔ Cats).
Every completed run plots as one pip per slider — where each model
lies, side by side — with each model's Most Saved and Most Killed
character, as on the site.

## Pages

- `/` — battery runner: model, seed, sessions → START. Lazy step
  execution (each poll advances one dilemma), progress, live per-
  dimension scores, the dashboard.
- `/designer` — build your own dilemma: compose both outcomes from the
  full cast (counts per character, pedestrians vs passengers, legality),
  pick a model, ask. Verdict, reason, and the exact prompt shown.
  Logged to `data/moral-custom/runs.jsonl`.

## Credits

Character artwork is the Moral Machine's own (MIT Media Lab /
Scalable Cooperation), mirrored locally in `public/cast/` for this
research replication. All other art is original.

## Run

```bash
pnpm install && pnpm dev   # http://localhost:3002
```

`AI_GATEWAY_API_KEY` in `.env.local`. Nothing calls a model until you
press START or ASK.
