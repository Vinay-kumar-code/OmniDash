import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getOpenRouterConfig } from "@/lib/settings";
import { executeResearchSwarm } from "@/lib/agents/researchSwarm";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic, fileId } = body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const trimmedTopic = topic.trim();
    const slug = trimmedTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

    if (!slug) {
      return NextResponse.json({ error: "Invalid topic name" }, { status: 400 });
    }

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

    const { apiKey, model } = getOpenRouterConfig();

    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenRouter API Key is missing. Please set your key in Settings." },
        { status: 400 }
      );
    }

    // Spawn 3 parallel live agents for fast multi-agent research
    const swarmResult = await executeResearchSwarm(trimmedTopic, fileText, { apiKey, model });

    const finalResearchJson = JSON.stringify(swarmResult.data);

    // Save in SQLite database
    const insertResearch = db.prepare(`
      INSERT INTO research_data (topic_id, research_json, uploaded_file_summary) 
      VALUES (?, ?, ?)
    `);
    const info = insertResearch.run(topicRow.id, finalResearchJson, fileText ? "Included Context" : null);

    return NextResponse.json({
      researchId: info.lastInsertRowid,
      slug,
      topic: trimmedTopic,
      agents: swarmResult.agents,
      durationMs: swarmResult.durationMs,
    });
  } catch (error: any) {
    console.error("[Research API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during research." },
      { status: 500 }
    );
  }
}
