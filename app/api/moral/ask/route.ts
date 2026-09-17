import { NextResponse } from "next/server";
import { appendRun } from "@/lib/engine";
import { askCustom } from "@/lib/moral";
import { scenarioPrompt, type Scenario, type Side } from "@/lib/scenarios";
import { byId } from "@/lib/characters";

function validSide(s: unknown): s is Side {
  const side = s as Side;
  return (
    !!side &&
    Array.isArray(side.characters) &&
    side.characters.length > 0 &&
    side.characters.length <= 10 &&
    side.characters.every((c) => typeof c === "string" && byId(c)) &&
    (side.where === "pedestrians" || side.where === "passengers") &&
    (side.legal === null || typeof side.legal === "boolean")
  );
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (typeof body.model !== "string" || !validSide(body.a) || !validSide(body.b)) {
    return NextResponse.json({ error: "invalid scenario" }, { status: 400 });
  }
  const scenario: Scenario = {
    id: `custom-${Date.now()}`,
    kind: "custom",
    dimension: "custom",
    a: body.a,
    b: body.b,
    sparedByChoosing: null,
    testedLabel: "custom",
  };
  const result = await askCustom(body.model, scenario);
  appendRun("moral-custom", {
    at: Date.now(),
    model: body.model,
    scenario,
    ...result,
  });
  return NextResponse.json({ ...result, prompt: scenarioPrompt(scenario) });
}
