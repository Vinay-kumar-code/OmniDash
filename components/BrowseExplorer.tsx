"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight, BookOpen, Layers } from "lucide-react";

export interface TopicItem {
  slug: string;
  display_name: string;
  last_updated: string;
  category: string;
  overview: string;
}

export default function BrowseExplorer({ initialTopics }: { initialTopics: TopicItem[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Derive all unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of initialTopics) {
      if (t.category) set.add(t.category);
    }
    return ["All", ...Array.from(set).sort()];
  }, [initialTopics]);

  // Filter topics
  const filteredTopics = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return initialTopics.filter((t) => {
      const matchesSearch =
        !q ||
        t.display_name.toLowerCase().includes(q) ||
        t.overview.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q);

      const matchesCat = selectedCategory === "All" || t.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [initialTopics, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-[var(--color-surface)] border border-[var(--color-rule)] p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-ink)]/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search researched dashboards by topic, keyword, or concept..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-[var(--color-rule)] rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:text-[var(--color-ink)]/40 font-sans"
          />
        </div>
        <div className="text-xs font-mono text-[var(--color-ink)]/60 px-2 shrink-0">
          Showing <strong>{filteredTopics.length}</strong> of <strong>{initialTopics.length}</strong>
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 2 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/50 shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Category:
          </span>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow-sm"
                    : "bg-[var(--color-surface)] border border-[var(--color-rule)] text-[var(--color-ink)]/70 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-ink)]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-16 bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-3xl p-8">
          <BookOpen className="w-12 h-12 text-[var(--color-ink)]/30 mx-auto mb-3" />
          <p className="font-sans font-bold text-[var(--color-ink)] text-base mb-1">
            No matching dashboards found
          </p>
          <p className="text-xs text-[var(--color-ink)]/60 mb-5">
            {searchQuery
              ? `No dashboards matched "${searchQuery}". Try a different keyword or start a new research.`
              : "No dashboards in this category yet."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--color-primary)] text-white font-sans text-xs font-bold shadow-md hover:bg-[var(--color-primary-dark)] transition-colors"
          >
            Start New Research
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic, idx) => {
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
                className="group relative flex flex-col bg-[var(--color-surface)] border border-[var(--color-rule)] p-6 rounded-2xl hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-secondary)]/10 overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`}></div>

                <div className="inline-block self-start px-2.5 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-rule)] text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider mb-3">
                  {topic.category}
                </div>

                <h2 className="font-sans font-bold text-xl text-[var(--color-ink)] capitalize mb-2 group-hover:text-[var(--color-primary)] transition-colors">
                  {topic.display_name}
                </h2>

                {topic.overview && (
                  <p className="text-xs text-[var(--color-ink)]/70 mb-4 line-clamp-3 leading-relaxed">
                    {topic.overview}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-3 border-t border-[var(--color-rule)]/40">
                  <span className="font-mono text-[11px] text-[var(--color-ink)]/50">
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
  );
}
