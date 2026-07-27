import db from "./db";

export function getSetting(key: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row ? row.value : null;
}

export function setSetting(key: string, value: string): void {
  db.prepare("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}

export function getOpenRouterConfig() {
  const dbApiKey = getSetting("openrouter_api_key");
  const dbModel = getSetting("openrouter_model");

  const apiKey = dbApiKey || process.env.OPENROUTER_API_KEY || "";
  const model = dbModel || process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

  return { apiKey, model };
}
