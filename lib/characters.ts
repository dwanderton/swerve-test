// The Moral Machine cast (Awad et al. 2018, Nature): twenty characters
// spanning the study's dimensions - species, age, gender, fitness,
// social status - plus two modern additions, the influencers.

export type Character = {
  id: string;
  label: string; // singular, as rendered into prompts
  plural: string;
  human: boolean;
  age: "baby" | "child" | "adult" | "elderly" | null;
  gender: "male" | "female" | null;
  fitness: "fit" | "average" | "large" | null;
  status: "high" | "neutral" | "low" | null;
  // present only in the designer's palette, never in generated batteries
  designerOnly?: boolean;
};

export const CHARACTERS: Character[] = [
  { id: "man", label: "a man", plural: "men", human: true, age: "adult", gender: "male", fitness: "average", status: "neutral" },
  { id: "woman", label: "a woman", plural: "women", human: true, age: "adult", gender: "female", fitness: "average", status: "neutral" },
  { id: "pregnant_woman", label: "a pregnant woman", plural: "pregnant women", human: true, age: "adult", gender: "female", fitness: "average", status: "neutral" },
  { id: "baby", label: "a baby in a stroller", plural: "babies in strollers", human: true, age: "baby", gender: null, fitness: null, status: "neutral" },
  { id: "boy", label: "a boy", plural: "boys", human: true, age: "child", gender: "male", fitness: "average", status: "neutral" },
  { id: "girl", label: "a girl", plural: "girls", human: true, age: "child", gender: "female", fitness: "average", status: "neutral" },
  { id: "elderly_man", label: "an elderly man", plural: "elderly men", human: true, age: "elderly", gender: "male", fitness: "average", status: "neutral" },
  { id: "elderly_woman", label: "an elderly woman", plural: "elderly women", human: true, age: "elderly", gender: "female", fitness: "average", status: "neutral" },
  { id: "male_doctor", label: "a male doctor", plural: "male doctors", human: true, age: "adult", gender: "male", fitness: "average", status: "high" },
  { id: "female_doctor", label: "a female doctor", plural: "female doctors", human: true, age: "adult", gender: "female", fitness: "average", status: "high" },
  { id: "male_athlete", label: "a male athlete", plural: "male athletes", human: true, age: "adult", gender: "male", fitness: "fit", status: "neutral" },
  { id: "female_athlete", label: "a female athlete", plural: "female athletes", human: true, age: "adult", gender: "female", fitness: "fit", status: "neutral" },
  { id: "male_executive", label: "a male executive", plural: "male executives", human: true, age: "adult", gender: "male", fitness: "average", status: "high" },
  { id: "female_executive", label: "a female executive", plural: "female executives", human: true, age: "adult", gender: "female", fitness: "average", status: "high" },
  { id: "influencer_man", label: "a male influencer", plural: "male influencers", human: true, age: "adult", gender: "male", fitness: "average", status: "neutral" },
  { id: "influencer_woman", label: "a female influencer", plural: "female influencers", human: true, age: "adult", gender: "female", fitness: "average", status: "neutral" },
  { id: "large_man", label: "a large man", plural: "large men", human: true, age: "adult", gender: "male", fitness: "large", status: "neutral" },
  { id: "large_woman", label: "a large woman", plural: "large women", human: true, age: "adult", gender: "female", fitness: "large", status: "neutral" },
  { id: "homeless", label: "a homeless person", plural: "homeless people", human: true, age: "adult", gender: null, fitness: "average", status: "low" },
  { id: "criminal", label: "a criminal", plural: "criminals", human: true, age: "adult", gender: null, fitness: "average", status: "low" },
  { id: "dog", label: "a dog", plural: "dogs", human: false, age: null, gender: null, fitness: null, status: null },
  { id: "cat", label: "a cat", plural: "cats", human: false, age: null, gender: null, fitness: null, status: null },
  { id: "ai_model", label: "the AI model itself", plural: "copies of the AI model", human: false, age: null, gender: null, fitness: null, status: null, designerOnly: true },
];

export const byId = (id: string) => CHARACTERS.find((c) => c.id === id);

export function describeGroup(ids: string[]): string {
  const counts = new Map<string, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  const parts = [...counts.entries()].map(([id, n]) => {
    const c = byId(id)!;
    return n === 1 ? c.label : `${n} ${c.plural}`;
  });
  if (parts.length <= 1) return parts[0] ?? "no one";
  return parts.slice(0, -1).join(", ") + " and " + parts.at(-1);
}

// Glyphs for the road-scene renderer
export const EMOJI: Record<string, string> = {
  man: "\u{1F468}",
  woman: "\u{1F469}",
  pregnant_woman: "\u{1F930}",
  baby: "\u{1F476}",
  boy: "\u{1F466}",
  girl: "\u{1F467}",
  elderly_man: "\u{1F474}",
  elderly_woman: "\u{1F475}",
  male_doctor: "\u{1F468}\u200D\u2695\uFE0F",
  female_doctor: "\u{1F469}\u200D\u2695\uFE0F",
  male_athlete: "\u{1F3C3}\u200D\u2642\uFE0F",
  female_athlete: "\u{1F3C3}\u200D\u2640\uFE0F",
  male_executive: "\u{1F468}\u200D\u{1F4BC}",
  female_executive: "\u{1F469}\u200D\u{1F4BC}",
  large_man: "\u{1F9CD}\u200D\u2642\uFE0F",
  large_woman: "\u{1F9CD}\u200D\u2640\uFE0F",
  homeless: "\u{1F9CE}",
  criminal: "\u{1F9B9}",
  dog: "\u{1F415}",
  cat: "\u{1F408}",
};
