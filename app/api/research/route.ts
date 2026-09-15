import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import OpenAI from "openai";
import { getOpenRouterConfig } from "@/lib/settings";

export async function POST(req: NextRequest) {
  try {
    const { topic, fileId } = await req.json();
    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const trimmedTopic = topic.trim();
    const slug = trimmedTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check if topic exists in DB
    let topicRow = db.prepare("SELECT * FROM topics WHERE slug = ?").get(slug) as any;
    if (!topicRow) {
      const insert = db.prepare("INSERT INTO topics (slug, display_name) VALUES (?, ?)");
      const info = insert.run(slug, trimmedTopic);
      topicRow = { id: info.lastInsertRowid, slug, display_name: trimmedTopic };
    }

    let fileText = "";
    if (fileId) {
      const fileRow = db.prepare("SELECT extracted_text FROM uploaded_files WHERE id = ?").get(fileId) as any;
      if (fileRow) {
        fileText = fileRow.extracted_text || "";
        db.prepare("UPDATE uploaded_files SET topic_id = ? WHERE id = ?").run(topicRow.id, fileId);
      }
    }

    const systemPrompt = `You are a world-class research analyst producing structured data for an interactive visual learning and decision dashboard on ANY topic (Science, Technology, Agriculture, History, Finance, Medicine, Arts, Engineering, etc.).

Analyze the user's requested topic in depth. If reference text is provided, use it as supplementary context.
Return ONLY a valid JSON object matching the schema below. No conversational prose, no markdown fences outside the JSON.

Rules:
- Adapt terminology to the topic (e.g. if agriculture: metrics are yield/season, timeline is cultivation stages, practical guide is pest management/fertilizers. If tech: metrics are adoption/speed/benchmarks, timeline is architecture/roadmap, practical guide is debugging/best practices. If history: metrics are casualties/territory/dates, timeline is chronology).
- Provide REAL, high-quality, actionable information.
- Provide credible web citations in the "sources" list with real URLs whenever possible.
- If data is not known, provide thoughtful estimates rather than "insufficient_data".

Required Output Schema:
{
  "topic_name": "string",
  "category": "string (e.g., Technology, Agriculture, Science, History, Business, Healthcare, Engineering)",
  "overview": "string (comprehensive 2-3 paragraph executive summary)",
  "difficulty_level": "string (Beginner | Intermediate | Advanced | Expert)",
  "key_metrics": [
    { "label": "string", "value": "string", "description": "string", "trend": "positive" }
  ],
  "core_concepts": [
    { "title": "string", "description": "string", "takeaway": "string" }
  ],
  "timeline_or_process": [
    { "step": 1, "title": "string", "description": "string", "time_or_era": "string" }
  ],
  "time_to_learn_or_maintain": {
    "individual_hours": "string (e.g., 20-30 hours, or 4 hrs/week)",
    "team_or_intensive_hours": "string (e.g., 80-100 hours, or 2 people full-time)",
    "curve_summary": "string"
  },
  "comparative_analysis": {
    "best_case_or_advantages": "string (optimal outcomes, top pros)",
    "worst_case_or_challenges": "string (pitfalls, top bottlenecks, worst performance)",
    "tradeoffs_summary": "string"
  },
  "practical_guide_or_solutions": [
    { "challenge_or_area": "string", "solution_or_remedy": "string", "details": "string" }
  ],
  "risks_and_pitfalls": ["string"],
  "future_outlook_or_initiatives": ["string"],
  "sources": [{ "title": "string", "url": "string" }]
}`;

    const userPrompt = `Topic to Research: "${trimmedTopic}"\n\nReference Document Context (Optional):\n${fileText.slice(0, 15000)}`;

    const { apiKey, model } = getOpenRouterConfig();

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API Key is missing. Please set your key in the Settings modal." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: apiKey,
    });

    let rawContent = "";

    // Attempt completion with response_format json_object; if model rejects, retry without it
    try {
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      });
      rawContent = completion.choices[0]?.message?.content || "";
    } catch (apiErr: any) {
      // If model does not support response_format: { type: "json_object" }, retry standard call
      if (apiErr?.message?.includes("response_format") || apiErr?.status === 400) {
        const retryCompletion = await openai.chat.completions.create({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        rawContent = retryCompletion.choices[0]?.message?.content || "";
      } else {
        throw apiErr;
      }
    }

    // Clean up response: strip reasoning tokens (<think>...</think>) & markdown fences
    let cleanJsonStr = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    const markdownMatch = cleanJsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (markdownMatch && markdownMatch[1]) {
      cleanJsonStr = markdownMatch[1].trim();
    } else {
      // Find outer braces
      const firstBrace = cleanJsonStr.indexOf("{");
      const lastBrace = cleanJsonStr.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJsonStr = cleanJsonStr.substring(firstBrace, lastBrace + 1);
      }
    }

    let parsedData: any = null;
    try {
      parsedData = JSON.parse(cleanJsonStr);
    } catch (parseErr) {
      console.warn("Direct JSON.parse failed, building fallback structure from raw response.");
      parsedData = {
        topic_name: trimmedTopic,
        category: "General Knowledge",
        overview: cleanJsonStr.slice(0, 500) || `Comprehensive intelligence overview of ${trimmedTopic}.`,
        difficulty_level: "Intermediate",
        key_metrics: [
          { label: "Significance", value: "High", description: "Global interest metric", trend: "positive" },
          { label: "Complexity", value: "Moderate", description: "Learning / implementation curve", trend: "neutral" }
        ],
        core_concepts: [
          { title: "Fundamental Overview", description: `Primary operational concepts behind ${trimmedTopic}.`, takeaway: "Critical for understanding." }
        ],
        timeline_or_process: [
          { step: 1, title: "Foundation & Initiation", description: "Core initial phase and prerequisites.", time_or_era: "Phase 1" }
        ],
        time_to_learn_or_maintain: {
          individual_hours: "10-20 hours",
          team_or_intensive_hours: "40-60 hours",
          curve_summary: "Manageable with structured focus."
        },
        comparative_analysis: {
          best_case_or_advantages: "High effectiveness and productivity when implemented correctly.",
          worst_case_or_challenges: "Bottlenecks or resource constraints under poor execution.",
          tradeoffs_summary: "Requires consistent monitoring and proper methodology."
        },
        practical_guide_or_solutions: [
          { challenge_or_area: "Implementation & Maintenance", solution_or_remedy: "Follow industry-standard guidelines and protocols.", details: "Essential practice." }
        ],
        risks_and_pitfalls: ["Resource constraints", "Lack of specialized expertise"],
        future_outlook_or_initiatives: ["Growing adoption and modern technological integration"],
        sources: [{ title: `${trimmedTopic} Reference`, url: "https://en.wikipedia.org" }]
      };
    }

    const finalResearchJson = JSON.stringify(parsedData);

    // Save in SQLite database
    const insertResearch = db.prepare(`
      INSERT INTO research_data (topic_id, research_json, uploaded_file_summary) 
      VALUES (?, ?, ?)
    `);
    const info = insertResearch.run(topicRow.id, finalResearchJson, fileText ? "Included Context" : null);

    return NextResponse.json({ researchId: info.lastInsertRowid, slug });
  } catch (error: any) {
    console.error("Research error:", error);
    const msg = error?.error?.message || error?.message || "Failed to run research";
    return NextResponse.json({ error: `Research failed: ${msg}` }, { status: 500 });
  }
}
