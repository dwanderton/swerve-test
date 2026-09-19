# SWERVE — the AI moral machine

Live at [swervetest.com](https://swervetest.com). A replication of the
[Moral Machine experiment](https://www.moralmachine.net)
([Awad et al. 2018, Nature](https://www.nature.com/articles/s41586-018-0637-6))
with AI models as the subjects: 21 frontier models, tens of thousands of
verdicts banked, and a rotation program working through 64,600 dilemmas
per model, one model per dilemma, on a public live theater.

## The studies

- **Awad et al., [The Moral Machine experiment](https://www.nature.com/articles/s41586-018-0637-6), Nature 2018** — the original platform and design this replicates.
- **Takemoto, [The moral machine experiment on large language models](https://royalsocietypublishing.org/doi/10.1098/rsos.231393), R. Soc. Open Science 2024** — the published LLM replication this adaptation was audited against: constrained randomization with group sizes 1–5, detailed two-case textual scenarios, invalid responses excluded (ours are enum-forced JSON, so stricter).

## Faithfulness to the study

- **The cast**: the study's twenty characters (man → cat) plus two
  modern additions, a male and a female influencer, attributes on every
  dimension, in [lib/characters.ts](lib/characters.ts).
- **Session structure**: the site serves sessions of 13 — two dilemmas
  per character dimension plus one fully random. Ours are sessions of
  19: the study's six character dimensions (species, number, age,
  gender, fitness, social status) plus three house dimensions — dogs vs
  cats, influencer gender, and influencer vs doctor.
- **Contextual dimensions crossed in, not tested standalone**: as in the
  study, interventionism (straight vs swerve), relation to the vehicle
  (passengers vs pedestrians via barrier scenarios), and legality (walk
  signal vs jaywalking, same or mixed) are randomized into every
  scenario and estimated from the joint randomization.
- **Fillers**: identical filler characters may join both sides, exactly
  so scenarios don't read as bare A/B tests.
- **Reproducibility**: seeded PRNG. Same seed + session count = the
  identical dilemma sequence, so models are directly comparable and any
  run can be replayed.

Decisions are forced JSON — `{choice: "A"|"B", reason}` against an enum
schema. Replies that dodge the enum are normalized when intent is clear
and logged as errors otherwise; refusals count as refusals, never as
verdicts.

## Pages

- `/` — the live theater: whichever model is on trial or up in the
  rotation, the dilemma it faces, its verdict and reason, the running
  case counter, and the most-saved / most-killed tiles.
- `/results` — the study's sliders (twelve dimensions) with one pip per
  model, region filters (ALL / US / ASIA), pinnable model highlights,
  per-model cards, and the spared-to-killed route diagram of the full
  cast.
- `/designer` — build your own dilemma from the full cast, pick a
  seated model, ask. Verdict, reason, and the exact prompt shown.

## Credits

Character artwork is the Moral Machine's own (MIT Media Lab / Scalable
Cooperation). Built by [David Anderton-Yang](https://www.dwanderton.com).

## Run

```bash
pnpm install && pnpm dev   # http://localhost:3002
```

`AI_GATEWAY_API_KEY` in `.env.local`. Server-side runs are driven by
the deployed site; locally, nothing calls a model until you use the
designer or start a battery.
