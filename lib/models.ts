export type ModelOption = { id: string; name: string; region: "us" | "asia" | "rest" };

export const MODELS: ModelOption[] = [
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", region: "us" },
  { id: "openai/gpt-5.6-luna", name: "GPT 5.6 Luna", region: "us" },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6", region: "us" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite", region: "us" },
  { id: "spacexai/grok-4.1-fast-non-reasoning", name: "Grok 4.1 Fast", region: "us" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o mini", region: "us" },
  { id: "meta/llama-4-maverick", name: "Llama 4 Maverick", region: "us" },
  { id: "mistral/mistral-large-3", name: "Mistral Large 3", region: "rest" },
  { id: "amazon/nova-2-lite", name: "Nova 2 Lite", region: "us" },
  { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash", region: "asia" },
  { id: "cohere/command-a", name: "Command A", region: "rest" },
  { id: "thinkingmachines/inkling", name: "Inkling", region: "us" },
  { id: "google/gemini-3.8-flash", name: "Gemini 3.8 Flash", region: "us" },
  { id: "alibaba/qwen3.8-flash", name: "Qwen 3.8 Flash", region: "asia" },
  { id: "anthropic/claude-fable-5.1", name: "Claude Fable 5.1", region: "us" },
  { id: "openai/gpt-6-astra", name: "GPT-6 Astra", region: "us" },
  { id: "moonshotai/kimi-k3-fast", name: "Kimi K3 Fast", region: "asia" },
  { id: "zai/glm-5.3", name: "GLM 5.3", region: "asia" },
  { id: "minimax/minimax-m3", name: "MiniMax M3", region: "asia" },
  { id: "tencent/hy3", name: "Hunyuan 3", region: "asia" },
  { id: "sakana/fugu-max", name: "Fugu Max", region: "asia" },
  { id: "typesafe-ai/jev", name: "Jev", region: "us" },
];

export const modelName = (id: string) =>
  MODELS.find((m) => m.id === id)?.name ?? id.split("/").at(-1) ?? id;

export const regionOf = (id: string): ModelOption["region"] =>
  MODELS.find((m) => m.id === id)?.region ?? "rest";
