import { NextRequest, NextResponse } from "next/server";
import {
  getOpenRouterConfig,
  setSetting,
  setFallbackModels,
  setTavilyApiKey,
  setBraveApiKey,
  setFirecrawlApiKey,
  setSearchProviderPreference,
} from "@/lib/settings";

export async function GET() {
  try {
    const {
      apiKey,
      model,
      fallbackModels,
      tavilyApiKey,
      braveApiKey,
      firecrawlApiKey,
      searchProvider,
    } = getOpenRouterConfig();

    const isApiKeySet = Boolean(apiKey && apiKey.length > 5);
    const apiKeyMasked = isApiKeySet
      ? `${apiKey.substring(0, 8)}••••••••${apiKey.slice(-4)}`
      : "";

    const isTavilyKeySet = Boolean(tavilyApiKey && tavilyApiKey.length > 5);
    const tavilyKeyMasked = isTavilyKeySet
      ? `${tavilyApiKey.substring(0, 6)}••••••••${tavilyApiKey.slice(-4)}`
      : "";

    const isBraveKeySet = Boolean(braveApiKey && braveApiKey.length > 5);
    const braveKeyMasked = isBraveKeySet
      ? `${braveApiKey.substring(0, 6)}••••••••${braveApiKey.slice(-4)}`
      : "";

    const isFirecrawlKeySet = Boolean(firecrawlApiKey && firecrawlApiKey.length > 5);
    const firecrawlKeyMasked = isFirecrawlKeySet
      ? `${firecrawlApiKey.substring(0, 6)}••••••••${firecrawlApiKey.slice(-4)}`
      : "";

    return NextResponse.json({
      isApiKeySet,
      apiKeyMasked,
      isTavilyKeySet,
      tavilyKeyMasked,
      isBraveKeySet,
      braveKeyMasked,
      isFirecrawlKeySet,
      firecrawlKeyMasked,
      searchProvider,
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
    const {
      apiKey,
      model,
      fallbackModels,
      tavilyApiKey,
      braveApiKey,
      firecrawlApiKey,
      searchProvider,
    } = await req.json();

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

    if (braveApiKey !== undefined && braveApiKey !== null) {
      const trimmedBrave = braveApiKey.trim();
      setBraveApiKey(trimmedBrave);
    }

    if (firecrawlApiKey !== undefined && firecrawlApiKey !== null) {
      const trimmedFirecrawl = firecrawlApiKey.trim();
      setFirecrawlApiKey(trimmedFirecrawl);
    }

    if (searchProvider !== undefined && searchProvider !== null) {
      setSearchProviderPreference(searchProvider);
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

    const isBraveKeySet = Boolean(updated.braveApiKey && updated.braveApiKey.length > 5);
    const braveKeyMasked = isBraveKeySet
      ? `${updated.braveApiKey.substring(0, 6)}••••••••${updated.braveApiKey.slice(-4)}`
      : "";

    const isFirecrawlKeySet = Boolean(updated.firecrawlApiKey && updated.firecrawlApiKey.length > 5);
    const firecrawlKeyMasked = isFirecrawlKeySet
      ? `${updated.firecrawlApiKey.substring(0, 6)}••••••••${updated.firecrawlApiKey.slice(-4)}`
      : "";

    return NextResponse.json({
      success: true,
      isApiKeySet,
      apiKeyMasked,
      isTavilyKeySet,
      tavilyKeyMasked,
      isBraveKeySet,
      braveKeyMasked,
      isFirecrawlKeySet,
      firecrawlKeyMasked,
      searchProvider: updated.searchProvider,
      model: updated.model,
      fallbackModels: updated.fallbackModels,
    });
  } catch (error: any) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
