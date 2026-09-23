import db from "./db";

export function getSetting(key: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export function setSetting(key: string, value: string): void {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

// Model alias resolution to handle deprecated or renamed OpenRouter models
const MODEL_ALIASES: Record<string, string> = {
  "stealth/union-alpha": "unbiased/pareto",
  "meta-llama/llama-3.3-70b-instruct:free": "unbiased/pareto",
  "google/gemini-2.0-flash-lite-001": "unbiased/pareto",
  "google/gemini-2.0-flash-exp:free": "unbiased/pareto",
};

export function resolveModelName(model?: string | null): string {
  if (!model) return "unbiased/pareto";
  const trimmed = model.trim();
  return MODEL_ALIASES[trimmed] || trimmed;
}

export function getOpenRouterConfig() {
  const dbApiKey = getSetting("openrouter_api_key");
  const dbModel = getSetting("openrouter_model");

  const apiKey = dbApiKey || process.env.OPENROUTER_API_KEY || "";
  const rawModel = dbModel || process.env.OPENROUTER_MODEL || "unbiased/pareto";
  const resolvedModel = resolveModelName(rawModel);

  // Auto-migrate persisted deprecated model in DB if necessary
  if (dbModel && resolvedModel !== dbModel) {
    try {
      setSetting("openrouter_model", resolvedModel);
    } catch {}
  }

  return { apiKey, model: resolvedModel };
}
