import db from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default async function BrowsePage() {
  const topics = db.prepare(`
    SELECT t.slug, t.display_name, MAX(d.created_at) as last_updated 
    FROM topics t
    JOIN dashboards d ON d.topic_id = t.id
    GROUP BY t.id
    ORDER BY last_updated DESC
  `).all() as any[];

  return (
    <main className="min-h-screen bg-[var(--color-bg)] p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between border-b-2 border-[var(--color-rule)] pb-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 p-2 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="font-sans font-black text-3xl text-[var(--color-ink)]">
              All Researched Topics
            </h1>
          </div>
          <Link 
            href="/"
            className="flex items-center gap-2 font-sans text-sm font-semibold border-2 border-[var(--color-ink)] px-4 py-2 hover:bg-[var(--color-ink)] hover:text-white transition-all shadow-[2px_2px_0_0_var(--color-ink)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <Search className="w-4 h-4" />
            New Search
          </Link>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-12">
            <p className="font-sans text-[var(--color-ink)]/60 text-lg">No topics researched yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <Link
                key={topic.slug}
                href={`/dashboard/${topic.slug}`}
                className="group block bg-[var(--color-surface)] border-2 border-[var(--color-ink)] p-6 transition-all hover:-translate-y-2 hover:shadow-[6px_6px_0_0_var(--color-primary)]"
              >
                <h2 className="font-sans font-bold text-xl text-[var(--color-ink)] capitalize mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                  {topic.display_name}
                </h2>
                <div className="flex items-center justify-between mt-6">
                  <span className="font-mono text-xs text-[var(--color-ink)]/50">
                    {new Date(topic.last_updated).toLocaleDateString()}
                  </span>
                  <span className="font-sans text-sm font-bold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                    View &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
