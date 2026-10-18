// URL slugs for per-model report cards: /results/claude-sonnet-4-6.
// Slugs derive from the display name so the URLs read well in search
// results; resolution scans the models actually present in the data.

import { modelName } from "./models";

export const modelSlug = (id: string) =>
  modelName(id)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function slugToModel(slug: string, modelIds: string[]): string | null {
  const want = slug.toLowerCase();
  return modelIds.find((id) => modelSlug(id) === want) ?? null;
}
