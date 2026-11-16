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
};

export function resolveModelName(model?: string | null): string {
  if (!model) return "unbiased/pareto";
  const trimmed = model.trim();
  return MODEL_ALIASES[trimmed] || trimmed;
}

export const DEFAULT_FALLBACK_MODELS = [
  "baidu/ernie-5.5-flash-preview:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
  "openrouter/auto",
];

export function getFallbackModels(): string[] {
  const raw = getSetting("openrouter_fallback_models");
  if (!raw) return [...DEFAULT_FALLBACK_MODELS];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((m) => resolveModelName(String(m))).filter(Boolean);
    }
  } catch {
    const parts = raw
      .split(/[\n,]+/)
      .map((s) => resolveModelName(s.trim()))
      .filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return [...DEFAULT_FALLBACK_MODELS];
}

export function setFallbackModels(models: string[] | string): void {
  let modelList: string[] = [];
  if (Array.isArray(models)) {
    modelList = models.map((m) => resolveModelName(String(m).trim())).filter(Boolean);
  } else if (typeof models === "string") {
    modelList = models
      .split(/[\n,]+/)
      .map((s) => resolveModelName(s.trim()))
      .filter(Boolean);
  }
  if (modelList.length === 0) {
    modelList = [...DEFAULT_FALLBACK_MODELS];
  }
  const unique = Array.from(new Set(modelList));
  setSetting("openrouter_fallback_models", JSON.stringify(unique));
}

export function getTavilyApiKey(): string {
  const dbKey = getSetting("tavily_api_key");
  return (dbKey || process.env.TAVILY_API_KEY || "").trim();
}

export function setTavilyApiKey(key: string): void {
  setSetting("tavily_api_key", key.trim());
}

export function getBraveApiKey(): string {
  const dbKey = getSetting("brave_api_key");
  return (dbKey || process.env.BRAVE_API_KEY || "").trim();
}

export function setBraveApiKey(key: string): void {
  setSetting("brave_api_key", key.trim());
}

export function getFirecrawlApiKey(): string {
  const dbKey = getSetting("firecrawl_api_key");
  return (dbKey || process.env.FIRECRAWL_API_KEY || "").trim();
}

export function setFirecrawlApiKey(key: string): void {
  setSetting("firecrawl_api_key", key.trim());
}

export function getSearchProviderPreference(): string {
  const dbPref = getSetting("search_provider_preference");
  return (dbPref || process.env.SEARCH_PROVIDER || "auto").trim();
}

export function setSearchProviderPreference(pref: string): void {
  setSetting("search_provider_preference", pref.trim().toLowerCase());
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

  const fallbackModels = getFallbackModels();
  const tavilyApiKey = getTavilyApiKey();
  const braveApiKey = getBraveApiKey();
  const firecrawlApiKey = getFirecrawlApiKey();
  const searchProvider = getSearchProviderPreference();

  return {
    apiKey,
    model: resolvedModel,
    fallbackModels,
    tavilyApiKey,
    braveApiKey,
    firecrawlApiKey,
    searchProvider,
  };
}
