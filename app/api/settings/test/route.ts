import { NextRequest, NextResponse } from "next/server";
import { getOpenRouterConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { apiKey: providedKey } = body;

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
      { success: false, error: err?.message || "Failed to reach OpenRouter." },
      { status: 500 }
    );
  }
}
