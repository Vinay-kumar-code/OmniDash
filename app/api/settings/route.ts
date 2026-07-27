import { NextRequest, NextResponse } from "next/server";
import { getOpenRouterConfig, setSetting } from "@/lib/settings";

export async function GET() {
  try {
    const { apiKey, model } = getOpenRouterConfig();
    const isApiKeySet = Boolean(apiKey && apiKey.length > 5);

    let apiKeyMasked = "";
    if (isApiKeySet) {
      const prefix = apiKey.substring(0, 8);
      const suffix = apiKey.slice(-4);
      apiKeyMasked = `${prefix}••••••••${suffix}`;
    }

    return NextResponse.json({
      isApiKeySet,
      apiKeyMasked,
      model,
    });
  } catch (error: any) {
    console.error("GET settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { apiKey, model } = await req.json();

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

    const updated = getOpenRouterConfig();
    const isApiKeySet = Boolean(updated.apiKey && updated.apiKey.length > 5);
    const apiKeyMasked = isApiKeySet
      ? `${updated.apiKey.substring(0, 8)}••••••••${updated.apiKey.slice(-4)}`
      : "";

    return NextResponse.json({
      success: true,
      isApiKeySet,
      apiKeyMasked,
      model: updated.model,
    });
  } catch (error: any) {
    console.error("POST settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
