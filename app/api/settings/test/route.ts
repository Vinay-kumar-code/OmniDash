import { NextRequest, NextResponse } from "next/server";
import {
  getOpenRouterConfig,
  getTavilyApiKey,
  getBraveApiKey,
  getFirecrawlApiKey,
} from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey: providedKey, tavilyApiKey, braveApiKey, firecrawlApiKey, type } = body;

    // 1. Tavily API Key Testing
    if (type === "tavily") {
      const activeTavilyKey =
        providedKey?.trim() || tavilyApiKey?.trim() || getTavilyApiKey();
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
          const errMsg =
            errData.detail?.error ||
            (res.status === 401
              ? "Invalid Tavily API Key."
              : `Tavily returned HTTP ${res.status}`);
          return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
        }
      } catch (err: any) {
        clearTimeout(timer);
        return NextResponse.json(
          { success: false, error: err?.message || "Failed to reach Tavily API." },
          { status: 500 }
        );
      }
    }

    // 2. Brave Search API Key Testing
    if (type === "brave") {
      const activeBraveKey =
        providedKey?.trim() || braveApiKey?.trim() || getBraveApiKey();
      if (!activeBraveKey) {
        return NextResponse.json(
          { success: false, error: "No Brave Search API key provided to test." },
          { status: 400 }
        );
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);

      try {
        const res = await fetch(
          "https://api.search.brave.com/res/v1/web/search?q=test&count=1",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "X-Subscription-Token": activeBraveKey,
            },
            signal: controller.signal,
          }
        );
        clearTimeout(timer);

        if (res.ok) {
          return NextResponse.json({
            success: true,
            message: "Brave Search connection verified! Global web index search is active.",
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          const errMsg =
            errData.message ||
            (res.status === 401 || res.status === 403
              ? "Invalid Brave Search API Key."
              : `Brave Search returned HTTP ${res.status}`);
          return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
        }
      } catch (err: any) {
        clearTimeout(timer);
        return NextResponse.json(
          { success: false, error: err?.message || "Failed to reach Brave Search API." },
          { status: 500 }
        );
      }
    }

    // 3. Firecrawl API Key Testing
    if (type === "firecrawl") {
      const activeFirecrawlKey =
        providedKey?.trim() || firecrawlApiKey?.trim() || getFirecrawlApiKey();
      if (!activeFirecrawlKey) {
        return NextResponse.json(
          { success: false, error: "No Firecrawl API key provided to test." },
          { status: 400 }
        );
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);

      try {
        // First try team credit usage endpoint for credit metadata
        const usageRes = await fetch("https://api.firecrawl.dev/v1/team/credit-usage", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${activeFirecrawlKey}`,
          },
          signal: controller.signal,
        });

        if (usageRes.ok) {
          clearTimeout(timer);
          const usageData = await usageRes.json().catch(() => ({}));
          const credits =
            usageData?.data?.remaining_credits != null
              ? ` Remaining Credits: ${usageData.data.remaining_credits}`
              : "";
          return NextResponse.json({
            success: true,
            message: `Firecrawl connection verified! Deep search and scraping are active.${credits}`,
          });
        }

        // If team usage returned 401/403, key is invalid
        if (usageRes.status === 401 || usageRes.status === 403) {
          clearTimeout(timer);
          return NextResponse.json(
            { success: false, error: "Invalid Firecrawl API Key (Unauthorized)." },
            { status: 400 }
          );
        }

        // Secondary fallback test: try search endpoint with limit 1
        const searchRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeFirecrawlKey}`,
          },
          body: JSON.stringify({
            query: "OmniDash web intelligence test",
            limit: 1,
          }),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (searchRes.ok) {
          return NextResponse.json({
            success: true,
            message: "Firecrawl connection verified! Deep search and scraping are active.",
          });
        } else {
          const errData = await searchRes.json().catch(() => ({}));
          const errMsg =
            errData.error ||
            errData.message ||
            (searchRes.status === 401
              ? "Invalid Firecrawl API Key."
              : `Firecrawl returned HTTP ${searchRes.status}`);
          return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
        }
      } catch (err: any) {
        clearTimeout(timer);
        return NextResponse.json(
          { success: false, error: err?.message || "Failed to reach Firecrawl API." },
          { status: 500 }
        );
      }
    }

    // 4. OpenRouter API Key Testing (Default)
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
      const usage =
        data.data.usage != null ? `$${Number(data.data.usage).toFixed(3)}` : "N/A";
      const limit =
        data.data.limit != null ? `$${Number(data.data.limit).toFixed(2)}` : "Unlimited";

      return NextResponse.json({
        success: true,
        message: `Key valid! Usage: ${usage} | Limit: ${limit}`,
        label: data.data.label || "Active Key",
      });
    } else {
      const errMsg =
        data?.error?.message ||
        (res.status === 401 ? "Invalid API Key." : `API returned status ${res.status}`);
      return NextResponse.json({ success: false, error: errMsg }, { status: 400 });
    }
  } catch (err: any) {
    console.error("Test key endpoint error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Test request failed." },
      { status: 500 }
    );
  }
}
