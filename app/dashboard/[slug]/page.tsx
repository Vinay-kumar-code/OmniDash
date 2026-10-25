import db from "@/lib/db";
import DashboardFrame from "@/components/DashboardFrame";
import DashboardToolbar from "@/components/DashboardToolbar";
import { notFound } from "next/navigation";
import { generateDeterministicDashboard } from "@/lib/dashboardTemplate";
import DOMPurify from "isomorphic-dompurify";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function DashboardPage({ params }: PageProps) {
  const { slug } = await params;

  // Check if topic exists
  const topic = db.prepare("SELECT * FROM topics WHERE slug = ?").get(slug) as any;
  if (!topic) {
    notFound();
  }

  // Fetch the latest dashboard for this topic
  let dashboard = db.prepare(`
    SELECT d.html_content, t.display_name
    FROM dashboards d
    JOIN topics t ON d.topic_id = t.id
    WHERE t.slug = ?
    ORDER BY d.created_at DESC
    LIMIT 1
  `).get(slug) as any;

  // Auto-recovery: If research exists but dashboard wasn't generated yet, build it on the fly
  if (!dashboard) {
    const researchRow = db.prepare(`
      SELECT * FROM research_data 
      WHERE topic_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get(topic.id) as any;

    if (researchRow) {
      try {
        const parsed = JSON.parse(researchRow.research_json);
        const rawHtml = generateDeterministicDashboard(parsed);
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
          FORCE_BODY: true,
          ADD_TAGS: ["style", "svg", "path", "rect", "circle", "text", "line", "g", "polygon", "polyline"],
          ADD_ATTR: [
            "stroke", "fill", "viewBox", "d", "x", "y", "width", "height", "cx", "cy", "r",
            "stroke-width", "stroke-linecap", "stroke-linejoin", "text-anchor", "font-size",
            "font-weight", "opacity", "rx", "ry", "target", "rel", "href"
          ],
        });

        db.prepare(`
          INSERT INTO dashboards (topic_id, research_id, html_content)
          VALUES (?, ?, ?)
        `).run(topic.id, researchRow.id, cleanHtml);

        dashboard = {
          html_content: cleanHtml,
          display_name: topic.display_name,
        };
      } catch (err) {
        console.error("Auto-recovery dashboard generation failed:", err);
      }
    }
  }

  if (!dashboard) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <DashboardToolbar displayName={dashboard.display_name} slug={slug} />
      
      <div className="flex-1 overflow-hidden relative">
        <DashboardFrame html={dashboard.html_content} />
      </div>
    </main>
  );
}
