import db from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Search, ArrowRight, BookOpen } from "lucide-react";

export default async function BrowsePage() {
  const topics = db.prepare(`
    SELECT t.slug, t.display_name, MAX(d.created_at) as last_updated,
      (SELECT r.research_json FROM research_data r WHERE r.topic_id = t.id ORDER BY r.created_at DESC LIMIT 1) as latest_research
    FROM topics t
    JOIN dashboards d ON d.topic_id = t.id
    GROUP BY t.id
    ORDER BY last_updated DESC
  `).all() as any[];

  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
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
                Explore previous visual intelligence reports and learning roadmaps.
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

        {topics.length === 0 ? (
          <div className="text-center py-20 bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-3xl p-8">
            <BookOpen className="w-12 h-12 text-[var(--color-ink)]/30 mx-auto mb-4" />
            <p className="font-sans font-bold text-[var(--color-ink)] text-lg mb-2">No dashboards generated yet</p>
            <p className="text-sm text-[var(--color-ink)]/60 mb-6">
              Enter any topic on the home page to produce your first interactive dashboard.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-primary)] text-white font-sans text-sm font-bold shadow-md hover:bg-[var(--color-primary-dark)] transition-colors"
            >
              Start New Research
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic, idx) => {
              let category = "General Knowledge";
              let overview = "";
              try {
                if (topic.latest_research) {
                  const data = JSON.parse(topic.latest_research);
                  category = data.category || "General Knowledge";
                  overview = data.overview ? `${data.overview.slice(0, 110)}...` : "";
                }
              } catch {}

              const borderGradients = [
                "from-[var(--color-primary)] to-[var(--color-secondary)]",
                "from-[var(--color-secondary)] to-[var(--color-accent)]",
                "from-[var(--color-accent)] to-[var(--color-alert)]",
                "from-[var(--color-primary)] to-[var(--color-accent)]",
              ];
              const gradient = borderGradients[idx % borderGradients.length];

              return (
                <Link
                  key={topic.slug}
                  href={`/dashboard/${topic.slug}`}
                  className="group relative block bg-[var(--color-surface)] border border-[var(--color-rule)] p-6 rounded-2xl hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-secondary)]/10 overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}></div>
                  
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-rule)] text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider mb-3">
                    {category}
                  </div>

                  <h2 className="font-sans font-bold text-xl text-[var(--color-ink)] capitalize mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                    {topic.display_name}
                  </h2>

                  {overview && (
                    <p className="text-xs text-[var(--color-ink)]/70 mb-4 line-clamp-2">
                      {overview}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-rule)]/40">
                    <span className="font-mono text-xs text-[var(--color-ink)]/50">
                      {new Date(topic.last_updated).toLocaleDateString()}
                    </span>
                    <span className="font-sans text-xs font-bold text-[var(--color-primary)] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Dashboard <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
