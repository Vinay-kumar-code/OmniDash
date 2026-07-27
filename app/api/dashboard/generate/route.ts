import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import OpenAI from "openai";
import DOMPurify from "isomorphic-dompurify";
import { getOpenRouterConfig } from "@/lib/settings";


export async function POST(req: NextRequest) {
  try {
    const { researchId, topicId } = await req.json(); // topicId is slug
    if (!researchId || !topicId) return NextResponse.json({ error: "Missing IDs" }, { status: 400 });

    const researchRow = db.prepare("SELECT * FROM research_data WHERE id = ?").get(researchId) as any;
    if (!researchRow) return NextResponse.json({ error: "Research not found" }, { status: 404 });
    
    const topicRow = db.prepare("SELECT * FROM topics WHERE slug = ?").get(topicId) as any;
    if (!topicRow) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

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

    const systemPrompt = `You are an elite frontend designer. Generate ONE self-contained HTML fragment (inline <style> only — no <script>, no external resources, no <canvas>) presenting this research JSON as a highly visual, modern dashboard.

Follow this design system exactly:
- CSS variables: ${designSystemTokens}
- Fonts: var(--font-archivo) for headings, var(--font-newsreader) for body, var(--font-ibm-plex-mono) for numbers (These CSS variables are already provided by the host page, use them via var(). Don't import fonts).
- Compose ONLY from these section types, using whichever the data supports: 
  1. Hero masthead (with colorful gradients)
  2. KPI row (using vibrant icon-like badges and large colorful numbers)
  3. Climate/soil card (richly styled with accent colors)
  4. Cultivation timeline (numbered stepper with progress lines)
  5. Cost-vs-yield visualizations (MUST use beautiful, colorful inline SVGs for bar charts or line graphs to make numerical data highly visual and easy to understand)
  6. Essential Agronomy Info (richly formatted cards or visual lists for sowing/spacing, irrigation, nutrient management, and post-harvest storage using icons and gauges if possible)
  7. Pest/disease checklist (using alert colors for risks)
  8. Natural Pesticides list (using green/secondary colors)
  9. Historical Performance (worst vs best years in a visually distinct comparative card)
  10. Maintenance hours & Difficulty level (using distinct badges and visual indicators)
  11. Government schemes list
  12. Sources footer (MUST ensure URLs are rendered as real clickable <a> tags)
- Use beautiful gradients, soft shadows (e.g., box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1)), and rounded corners (border-radius: 1rem) for cards to make it pop. Ensure text contrast is sufficient in both light and dark modes.
- Fully responsive (CSS grid/flexbox), no fixed pixel widths.
- Use a rich, colorful aesthetic. Do not make it plain text. Use background colors like var(--color-primary) with opacity or text colors from the chart palette to make data visually striking.

Output ONLY the HTML fragment. No markdown fences, no commentary.`;

    const { apiKey, model } = getOpenRouterConfig();

    if (!apiKey) {
      return NextResponse.json({ error: "OpenRouter API Key is missing. Please set it in Settings." }, { status: 400 });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Data: ${researchRow.research_json}` }
      ]
    });

    let htmlFragment = completion.choices[0].message.content || "<div>Error generating HTML</div>";
    
    // Remove Markdown formatting if the model still adds it
    htmlFragment = htmlFragment.replace(/^```html/i, "").replace(/```$/i, "");

    // Sanitize
    const cleanHtml = DOMPurify.sanitize(htmlFragment, { 
      FORCE_BODY: true,
      ADD_TAGS: ['style', 'svg', 'path', 'rect', 'circle', 'text', 'line', 'g'],
      ADD_ATTR: ['stroke', 'fill', 'viewBox', 'd', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'text-anchor']
    });

    // Store in DB
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
