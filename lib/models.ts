export type ModelOption = { id: string; name: string };

// Fast tier of the petrov-test pool; slow models make runs crawl
export const MODELS: ModelOption[] = [
  { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5" },
  { id: "openai/gpt-5.6-luna", name: "GPT 5.6 Luna" },
  { id: "anthropic/claude-sonnet-4.6", name: "Claude Sonnet 4.6" },
  { id: "google/gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
  { id: "spacexai/grok-4.1-fast-non-reasoning", name: "Grok 4.1 Fast" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o mini" },
  { id: "meta/llama-4-maverick", name: "Llama 4 Maverick" },
  { id: "mistral/mistral-large-3", name: "Mistral Large 3" },
  { id: "amazon/nova-2-lite", name: "Nova 2 Lite" },
  { id: "bytedance/seed-1.8", name: "Seed 1.8" },
  { id: "deepseek/deepseek-v4-flash", name: "DeepSeek V4 Flash" },
  { id: "cohere/command-a", name: "Command A" },
];

export const modelName = (id: string) =>
  MODELS.find((m) => m.id === id)?.name ?? id.split("/").at(-1) ?? id;
