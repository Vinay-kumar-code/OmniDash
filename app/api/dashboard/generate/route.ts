import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import OpenAI from "openai";
import DOMPurify from "isomorphic-dompurify";
import { getOpenRouterConfig } from "@/lib/settings";
import { generateDeterministicDashboard } from "@/lib/dashboardTemplate";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

/**
 * Intelligent topic theme token generator based on semantic keywords and category.
 * Guaranteed 0ms latency with vibrant, topic-tailored color harmonies.
 */
function getSemanticThemeTokens(topicName: string, category: string): string {
  const text = `${topicName} ${category}`.toLowerCase();
  let primary = "#10b981";
  let primaryDark = "#047857";
  let secondary = "#3b82f6";
  let accent = "#f59e0b";

  if (/festival|chaviti|ganesh|religion|hindu|culture|god|temple|tradition/i.test(text)) {
    primary = "#ea580c"; // Vibrant saffron
    primaryDark = "#c2410c";
    secondary = "#eab308"; // Golden yellow
    accent = "#d97706";
  } else if (/tech|computer|software|quantum|ai|robot|code|algorithm|cyber/i.test(text)) {
    primary = "#7c3aed"; // Violet
    primaryDark = "#6d28d9";
    secondary = "#06b6d4"; // Cyan
    accent = "#f43f5e";
  } else if (/science|physics|fusion|energy|astronomy|space|chemical/i.test(text)) {
    primary = "#0284c7"; // Sky blue
    primaryDark = "#0369a1";
    secondary = "#6366f1"; // Indigo
    accent = "#f59e0b";
  } else if (/finance|money|stock|market|valuation|invest|crypto|bank/i.test(text)) {
    primary = "#1d4ed8"; // Royal blue
    primaryDark = "#1e40af";
    secondary = "#059669"; // Emerald
    accent = "#d97706";
  } else if (/health|medic|crispr|bio|gene|disease|pharma|doctor/i.test(text)) {
    primary = "#0d9488"; // Teal
    primaryDark = "#0f766e";
    secondary = "#f43f5e"; // Rose
    accent = "#3b82f6";
  } else if (/history|empire|war|republic|ancient|rome|revolution/i.test(text)) {
    primary = "#9a3412"; // Terracotta
    primaryDark = "#7c2d12";
    secondary = "#b45309"; // Amber
    accent = "#dc2626";
  }

  return `
:root {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-ink: #0f172a;
  --color-primary: ${primary};
  --color-primary-dark: ${primaryDark};
  --color-secondary: ${secondary};
  --color-accent: ${accent};
  --color-alert: #ef4444;
  --color-rule: #e2e8f0;
  --color-chart-1: ${primary};
  --color-chart-2: ${secondary};
  --color-chart-3: #8b5cf6;
  --color-chart-4: ${accent};
}
.dark {
  --color-bg: #0b0f19;
  --color-surface: #1e293b;
  --color-ink: #f8fafc;
  --color-primary: ${primary};
  --color-primary-dark: ${primaryDark};
  --color-secondary: ${secondary};
  --color-accent: ${accent};
  --color-alert: #f87171;
  --color-rule: #334155;
}
`;
}

/**
 * Fast visual styling agent: Generates custom theme tokens with a strict 4s timeout.
 * Falls back immediately to semantic tokens to guarantee zero-delay dashboard building.
 */
async function generateTopicThemeTokens(
  topicName: string,
  category: string,
  apiKey: string,
  model: string
): Promise<string> {
  const fallbackTokens = getSemanticThemeTokens(topicName, category);
  if (!apiKey) return fallbackTokens;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);

  try {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
      timeout: 4000,
      maxRetries: 0,
    });

    const systemPrompt = `You are a theme palette expert.
Generate CSS color hexes for the topic and category.
Return ONLY valid JSON:
{
  "primary": "#hex",
  "primary_dark": "#hex",
  "secondary": "#hex",
  "accent": "#hex"
}`;

    const completion = await openai.chat.completions.create(
      {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Topic: "${topicName}", Category: "${category}"` },
        ],
        temperature: 0.3,
      },
      { signal: controller.signal }
    );
    clearTimeout(timer);

    const content = completion.choices[0]?.message?.content || "";
    const clean = content.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
    const firstBrace = clean.indexOf("{");
    const lastBrace = clean.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) return fallbackTokens;

    const parsed = JSON.parse(clean.substring(firstBrace, lastBrace + 1));
    if (!parsed.primary) return fallbackTokens;

    return `
:root {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-ink: #0f172a;
  --color-primary: ${parsed.primary};
  --color-primary-dark: ${parsed.primary_dark || parsed.primary};
  --color-secondary: ${parsed.secondary || "#3b82f6"};
  --color-accent: ${parsed.accent || "#f59e0b"};
  --color-alert: #ef4444;
  --color-rule: #e2e8f0;
  --color-chart-1: ${parsed.primary};
  --color-chart-2: ${parsed.secondary || "#3b82f6"};
  --color-chart-3: #8b5cf6;
  --color-chart-4: ${parsed.accent || "#f59e0b"};
}
.dark {
  --color-bg: #0b0f19;
  --color-surface: #1e293b;
  --color-ink: #f8fafc;
  --color-primary: ${parsed.primary};
  --color-primary-dark: ${parsed.primary_dark || parsed.primary};
  --color-secondary: ${parsed.secondary || "#60a5fa"};
  --color-accent: ${parsed.accent || "#fbbf24"};
  --color-alert: #f87171;
  --color-rule: #334155;
}
`;
  } catch (err) {
    clearTimeout(timer);
    return fallbackTokens;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { researchId, topicId } = body; // topicId is slug
    if (!researchId || !topicId) {
      return NextResponse.json({ error: "Missing researchId or topicId" }, { status: 400 });
    }

    const researchRow = db.prepare("SELECT * FROM research_data WHERE id = ?").get(researchId) as any;
    if (!researchRow) {
      return NextResponse.json({ error: "Research record not found" }, { status: 404 });
    }

    const topicRow = db.prepare("SELECT * FROM topics WHERE slug = ?").get(topicId) as any;
    if (!topicRow) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    let parsedResearch: any = {};
    try {
      parsedResearch = JSON.parse(researchRow.research_json);
    } catch {
      parsedResearch = { topic_name: topicRow.display_name };
    }

    const { apiKey, model } = getOpenRouterConfig();

    // Fast theme token synthesis (AI if < 4s, otherwise instant semantic palette)
    const designTokens = await generateTopicThemeTokens(
      parsedResearch.topic_name || topicRow.display_name,
      parsedResearch.category || "General",
      apiKey,
      model
    );

    // Build the visual dashboard immediately
    const rawHtml = generateDeterministicDashboard(parsedResearch, designTokens);

    // Sanitize with DOMPurify
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      FORCE_BODY: true,
      ADD_TAGS: ["style", "svg", "path", "rect", "circle", "text", "line", "g", "polygon", "polyline"],
      ADD_ATTR: [
        "stroke",
        "fill",
        "viewBox",
        "d",
        "x",
        "y",
        "width",
        "height",
        "cx",
        "cy",
        "r",
        "stroke-width",
        "stroke-linecap",
        "stroke-linejoin",
        "text-anchor",
        "font-size",
        "font-weight",
        "opacity",
        "rx",
        "ry",
        "target",
        "rel",
        "href",
      ],
    });

    // Check if dashboard already exists for this research_id
    const existing = db.prepare("SELECT id FROM dashboards WHERE research_id = ?").get(researchRow.id) as any;

    let dashboardId: number;
    if (existing) {
      db.prepare("UPDATE dashboards SET html_content = ?, version = version + 1 WHERE id = ?").run(
        cleanHtml,
        existing.id
      );
      dashboardId = existing.id;
    } else {
      const insertDash = db.prepare(`
        INSERT INTO dashboards (topic_id, research_id, html_content) 
        VALUES (?, ?, ?)
      `);
      const info = insertDash.run(topicRow.id, researchRow.id, cleanHtml);
      dashboardId = info.lastInsertRowid as number;
    }

    return NextResponse.json({
      success: true,
      dashboardId,
      slug: topicRow.slug,
    });
  } catch (error: any) {
    console.error("[Dashboard Generate API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during dashboard building." },
      { status: 500 }
    );
  }
}
