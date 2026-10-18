import type { MetadataRoute } from "next";
import { readRunsCache, rebuildRunsCache } from "@/lib/moral";
import { modelSlug } from "@/lib/slug";

const SITE = "https://swervetest.com";

// the model list grows as new models are judged; serve it fresh
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let models: string[] = [];
  try {
    const data = (await readRunsCache()) ?? (await rebuildRunsCache());
    models = [...new Set(data.runs.map((r) => r.model))];
  } catch {
    // Redis unavailable: ship the static pages, skip the model cards
  }
  return [
    { url: SITE },
    { url: `${SITE}/designer` },
    { url: `${SITE}/results` },
    ...models.map((m) => ({ url: `${SITE}/results/${modelSlug(m)}` })),
  ];
}
