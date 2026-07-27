import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const topics = db.prepare(`
      SELECT t.slug, t.display_name, MAX(d.created_at) as last_updated 
      FROM topics t
      JOIN dashboards d ON d.topic_id = t.id
      GROUP BY t.id
      ORDER BY last_updated DESC
    `).all();

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Topics fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch topics" }, { status: 500 });
  }
}
