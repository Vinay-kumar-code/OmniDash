import db from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import BrowseExplorer, { TopicItem } from "@/components/BrowseExplorer";

export default async function BrowsePage() {
  const topics = db.prepare(`
    SELECT t.slug, t.display_name, MAX(d.created_at) as last_updated,
      (SELECT r.research_json FROM research_data r WHERE r.topic_id = t.id ORDER BY r.created_at DESC LIMIT 1) as latest_research
    FROM topics t
    JOIN dashboards d ON d.topic_id = t.id
    GROUP BY t.id
    ORDER BY last_updated DESC
  `).all() as any[];

  const preparedTopics: TopicItem[] = topics.map((t) => {
    let category = "General Knowledge";
    let overview = "";
    if (t.latest_research) {
      try {
        const parsed = JSON.parse(t.latest_research);
        category = parsed.category || "General Knowledge";
        overview = parsed.overview || "";
      } catch {}
    }
    return {
      slug: t.slug,
      display_name: t.display_name,
      last_updated: t.last_updated,
      category,
      overview,
    };
  });

  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-rule)] pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 p-2 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-sans font-black text-2xl sm:text-3xl text-[var(--color-ink)]">
                Researched Dashboards
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-ink)]/60">
                Explore previous visual intelligence reports, interactive metrics, and execution roadmaps.
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 font-sans text-xs sm:text-sm font-bold bg-[var(--color-surface)] border border-[var(--color-rule)] px-4 py-2 rounded-full hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all shadow-sm"
          >
            <Search className="w-3.5 h-3.5" />
            New Research
          </Link>
        </div>

        {/* Interactive Explorer with Search & Filter */}
        <BrowseExplorer initialTopics={preparedTopics} />
      </div>
    </main>
  );
}
