import { NextResponse } from "next/server";
import { appendRun, rateLimit, trimRuns } from "@/lib/engine";
import { askCustom } from "@/lib/moral";
import { scenarioPrompt, type Scenario, type Side } from "@/lib/scenarios";
import { byId } from "@/lib/characters";
import { MODELS } from "@/lib/models";

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
  // only seated models; an arbitrary slug would bill any model on the
  // gateway key
  if (
    typeof body.model !== "string" ||
    !MODELS.some((m) => m.id === body.model) ||
    !validSide(body.a) ||
    !validSide(body.b)
  ) {
    return NextResponse.json({ error: "invalid scenario" }, { status: 400 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`ask:${ip}`, 3, 60)) || !(await rateLimit("ask:global", 60, 60))) {
    return NextResponse.json(
      { error: "PRESS THE BRAKE FOR A MINUTE. OUR SERVERS NEED TO CATCH UP." },
      { status: 429 },
    );
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
  await appendRun("moral-custom", {
    at: Date.now(),
    model: body.model,
    scenario,
    ...result,
  });
  await trimRuns("moral-custom", 2000);
  return NextResponse.json({ ...result, prompt: scenarioPrompt(scenario) });
}
