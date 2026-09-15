import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import OpenAI from "openai";
import DOMPurify from "isomorphic-dompurify";
import { getOpenRouterConfig } from "@/lib/settings";
import { generateDeterministicDashboard } from "@/lib/dashboardTemplate";

export async function POST(req: NextRequest) {
  try {
    const { researchId, topicId } = await req.json(); // topicId is slug
    if (!researchId || !topicId) return NextResponse.json({ error: "Missing IDs" }, { status: 400 });

    const researchRow = db.prepare("SELECT * FROM research_data WHERE id = ?").get(researchId) as any;
    if (!researchRow) return NextResponse.json({ error: "Research not found" }, { status: 404 });

    const topicRow = db.prepare("SELECT * FROM topics WHERE slug = ?").get(topicId) as any;
    if (!topicRow) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

    let parsedResearch: any = {};
    try {
      parsedResearch = JSON.parse(researchRow.research_json);
    } catch {
      parsedResearch = { topic_name: topicRow.display_name };
    }

    const designSystemTokens = `
:root {
  --color-bg: #f4fdf8;
  --color-surface: #ffffff;
  --color-ink: #0f172a;
  --color-primary: #10b981;
  --color-primary-dark: #047857;
  --color-secondary: #3b82f6;
  --color-accent: #f59e0b;
  --color-alert: #ef4444;
  --color-rule: #e2e8f0;
  --color-chart-1: #10b981;
  --color-chart-2: #3b82f6;
  --color-chart-3: #8b5cf6;
  --color-chart-4: #f59e0b;
}
.dark {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-ink: #f8fafc;
  --color-primary: #10b981;
  --color-primary-dark: #34d399;
  --color-secondary: #3b82f6;
  --color-accent: #f59e0b;
  --color-alert: #f87171;
  --color-rule: #334155;
}
`;

    const systemPrompt = `You are an elite UI designer. Generate ONE self-contained, responsive HTML fragment with inline <style> (no <script>, no external resources) presenting this research JSON as a modern, data-dense, colorful intelligence dashboard.

Follow this design system exactly:
- CSS variables: ${designSystemTokens}
- Fonts: var(--font-archivo) for titles, var(--font-newsreader) for reading, var(--font-ibm-plex-mono) for stats (Already loaded).
- Structure into high-impact visual components:
  1. Hero masthead with category badges & difficulty indicator.
  2. KPI row with large colorful numbers, badges, and inline SVG charts (bar charts or line graphs).
  3. Core concepts cards with takeaways.
  4. Chronological stepper or timeline process.
  5. Comparative cards (Best case vs Worst case, advantages vs bottlenecks).
  6. Practical guide / Solutions / Remedies table or grid.
  7. Time allocation & resource metrics.
  8. Clickable reference sources at the footer.
- Visual Polish: soft rounded corners (16px-24px), subtle box-shadows, rich background gradients, high contrast text for both light and dark modes.
- Output ONLY the raw HTML fragment. Do not output markdown fences or conversational preambles.`;

    const { apiKey, model } = getOpenRouterConfig();

    let rawHtml = "";

    // Attempt AI Generation if API key is provided
    if (apiKey) {
      try {
        const openai = new OpenAI({
          baseURL: "https://openrouter.ai/api/v1",
          apiKey: apiKey,
        });

        const completion = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Data: ${researchRow.research_json}` },
          ],
        });

        rawHtml = completion.choices[0]?.message?.content || "";
      } catch (aiError) {
        console.warn("AI dashboard generation call failed. Will fall back to deterministic engine:", aiError);
        rawHtml = "";
      }
    }

    // Clean up response: strip reasoning tokens (<think>...</think>)
    let cleanedHtml = rawHtml.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // Extract HTML if wrapped in code blocks
    const codeBlockMatch = cleanedHtml.match(/```(?:html)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      cleanedHtml = codeBlockMatch[1].trim();
    }

    // Strict validation: Does it have legitimate HTML markup and reasonable size?
    const hasValidMarkup =
      cleanedHtml.length > 300 &&
      (cleanedHtml.includes("<div") || cleanedHtml.includes("<section") || cleanedHtml.includes("<style"));

    let finalHtml = "";
    if (hasValidMarkup) {
      finalHtml = cleanedHtml;
    } else {
      console.log("Model HTML output was malformed or incomplete. Using deterministic dashboard template.");
      finalHtml = generateDeterministicDashboard(parsedResearch, designSystemTokens);
    }

    // Sanitize with DOMPurify
    const cleanHtml = DOMPurify.sanitize(finalHtml, {
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

    // Save to Database
    const insertDashboard = db.prepare(`
      INSERT INTO dashboards (topic_id, research_id, html_content) 
      VALUES (?, ?, ?)
    `);
    insertDashboard.run(topicRow.id, researchId, cleanHtml);

    return NextResponse.json({ success: true, slug: topicId });
  } catch (error: any) {
    console.error("Dashboard generation error:", error);
    const msg = error?.error?.message || error?.message || "Failed to generate dashboard";
    return NextResponse.json({ error: `Dashboard generation failed: ${msg}` }, { status: 500 });
  }
}
