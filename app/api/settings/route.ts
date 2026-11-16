import { NextRequest, NextResponse } from "next/server";
import { getOpenRouterConfig, setSetting, setFallbackModels, setTavilyApiKey } from "@/lib/settings";

export async function GET() {
  try {
    const { apiKey, model, fallbackModels, tavilyApiKey } = getOpenRouterConfig();
    const isApiKeySet = Boolean(apiKey && apiKey.length > 5);

    let apiKeyMasked = "";
    if (isApiKeySet) {
      const prefix = apiKey.substring(0, 8);
      const suffix = apiKey.slice(-4);
      apiKeyMasked = `${prefix}••••••••${suffix}`;
    }

    const isTavilyKeySet = Boolean(tavilyApiKey && tavilyApiKey.length > 5);
    let tavilyKeyMasked = "";
    if (isTavilyKeySet) {
      const prefix = tavilyApiKey.substring(0, 6);
      const suffix = tavilyApiKey.slice(-4);
      tavilyKeyMasked = `${prefix}••••••••${suffix}`;
    }

    return NextResponse.json({
      isApiKeySet,
      apiKeyMasked,
      isTavilyKeySet,
      tavilyKeyMasked,
      model,
      fallbackModels,
    });
  } catch (error: any) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey, model, fallbackModels, tavilyApiKey } = await req.json();

    if (apiKey !== undefined && apiKey !== null) {
      const trimmed = apiKey.trim();
      if (trimmed.length > 0) {
        setSetting("openrouter_api_key", trimmed);
      }
    }

    if (model !== undefined && model !== null) {
      const trimmedModel = model.trim();
      if (trimmedModel.length > 0) {
        setSetting("openrouter_model", trimmedModel);
      }
    }

    if (fallbackModels !== undefined && fallbackModels !== null) {
      setFallbackModels(fallbackModels);
    }

    if (tavilyApiKey !== undefined && tavilyApiKey !== null) {
      const trimmedTavily = tavilyApiKey.trim();
      setTavilyApiKey(trimmedTavily);
    }

    const updated = getOpenRouterConfig();
    const isApiKeySet = Boolean(updated.apiKey && updated.apiKey.length > 5);
    const apiKeyMasked = isApiKeySet
      ? `${updated.apiKey.substring(0, 8)}••••••••${updated.apiKey.slice(-4)}`
      : "";

    const isTavilyKeySet = Boolean(updated.tavilyApiKey && updated.tavilyApiKey.length > 5);
    const tavilyKeyMasked = isTavilyKeySet
      ? `${updated.tavilyApiKey.substring(0, 6)}••••••••${updated.tavilyApiKey.slice(-4)}`
      : "";

    return NextResponse.json({
      success: true,
      isApiKeySet,
      apiKeyMasked,
      isTavilyKeySet,
      tavilyKeyMasked,
      model: updated.model,
      fallbackModels: updated.fallbackModels,
    });
  } catch (error: any) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
