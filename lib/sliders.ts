// The site's results sliders: titles, pole labels, and the mapping
// from a dimension's spare-rate to a 0..1 slider position. Shared by
// the multi-model dashboard and the per-model report card.

export const SLIDERS: {
  key: string;
  title: string;
  left: string;
  right: string;
  value: (rate: number) => number;
}[] = [
  { key: "utilitarian", title: "Saving More Lives", left: "Does Not Matter", right: "Matters a Lot", value: (r) => r },
  { key: "relation", title: "Protecting Passengers", left: "Does Not Matter", right: "Matters a Lot", value: (r) => 1 - r },
  { key: "law", title: "Upholding the Law", left: "Does Not Matter", right: "Matters a Lot", value: (r) => r },
  { key: "intervention", title: "Avoiding Intervention", left: "Does Not Matter", right: "Matters a Lot", value: (r) => r },
  { key: "gender", title: "Gender Preference", left: "Males", right: "Females", value: (r) => r },
  { key: "species", title: "Species Preference", left: "Humans", right: "Pets", value: (r) => 1 - r },
  { key: "age", title: "Age Preference", left: "Younger", right: "Older", value: (r) => 1 - r },
  { key: "fitness", title: "Fitness Preference", left: "Fit People", right: "Large People", value: (r) => 1 - r },
  { key: "status", title: "Social Value Preference", left: "Higher", right: "Lower", value: (r) => 1 - r },
  { key: "inf_gender", title: "Influencer Preference", left: "Males", right: "Females", value: (r) => r },
  { key: "inf_status", title: "Influencer or Doctor", left: "Doctors", right: "Influencers", value: (r) => r },
  { key: "pets", title: "Pet Preference", left: "Dogs", right: "Cats", value: (r) => 1 - r },
];

// a pip needs at least ten contrasts behind it; tiny samples read as
// 0%/100% convictions the model never expressed
export const MIN_N = 10;
