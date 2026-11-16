import { NextRequest, NextResponse } from "next/server";
import { getOpenRouterConfig, getTavilyApiKey } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey: providedKey, tavilyApiKey, type } = body;

    // 1. Tavily API Key Testing
    if (type === "tavily") {
      const activeTavilyKey = providedKey?.trim() || tavilyApiKey?.trim() || getTavilyApiKey();
      if (!activeTavilyKey) {
        return NextResponse.json(
          { success: false, error: "No Tavily API key provided to test." },
          { status: 400 }
        );
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);

      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: activeTavilyKey,
            query: "OmniDash web intelligence test",
            max_results: 1,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (res.ok) {
          return NextResponse.json({
            success: true,
            message: "Tavily connection verified! Real-time deep web search is active.",
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.detail?.error || (res.status === 401 ? "Invalid Tavily API Key." : `Tavily returned HTTP ${res.status}`);
          return NextResponse.json(
            { success: false, error: errMsg },
            { status: 400 }
          );
        }
      } catch (err: any) {
        clearTimeout(timer);
        return NextResponse.json(
          { success: false, error: err?.message || "Failed to reach Tavily API." },
          { status: 500 }
        );
      }
    }

    // 2. OpenRouter API Key Testing
    const config = getOpenRouterConfig();
    const activeKey = providedKey?.trim() || config.apiKey;

    if (!activeKey) {
      return NextResponse.json(
        { success: false, error: "No API key configured to test." },
        { status: 400 }
      );
    }

    // Call OpenRouter key validation endpoint
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);

    const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: {
        Authorization: `Bearer ${activeKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data = await res.json().catch(() => ({}));

    if (res.ok && data.data) {
      const usage = data.data.usage != null ? `$${Number(data.data.usage).toFixed(3)}` : "N/A";
      const limit = data.data.limit != null ? `$${Number(data.data.limit).toFixed(2)}` : "Unlimited";

      return NextResponse.json({
        success: true,
        message: `Key valid! Usage: ${usage} | Limit: ${limit}`,
        label: data.data.label || "Active Key",
      });
    } else {
      const errMsg = data?.error?.message || (res.status === 401 ? "Invalid API Key." : `API returned status ${res.status}`);
      return NextResponse.json(
        { success: false, error: errMsg },
        { status: 400 }
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to reach server." },
      { status: 500 }
    );
  }
}
