"use client";

import { useState, useEffect } from "react";
import SearchBox from "@/components/SearchBox";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { ArrowRight, Sparkles, BookOpen, Atom } from "lucide-react";

const SUGGESTED_TOPICS = [
  { label: "Tomato Cultivation", category: "Agriculture", icon: "🌱" },
  { label: "Quantum Computing", category: "Technology", icon: "⚛️" },
  { label: "CRISPR Gene Editing", category: "Biotech", icon: "🧬" },
  { label: "Options & Valuation", category: "Finance", icon: "📈" },
  { label: "Roman Republic History", category: "History", icon: "🏛️" },
  { label: "Nuclear Fusion Energy", category: "Science", icon: "⚡" },
];

export default function Home() {
  const [fileId, setFileId] = useState<number | null>(null);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [recentTopics, setRecentTopics] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRecentTopics(data.slice(0, 3));
        }
      });
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-4xl mx-auto space-y-10 py-10">
        {/* Hero Header */}
        <div className="text-center space-y-5 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--color-primary)]/15 blur-3xl rounded-full -z-10"></div>
          <div className="absolute top-12 left-1/3 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[var(--color-secondary)]/15 blur-3xl rounded-full -z-10"></div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Universal Visual Intelligence Platform
          </div>

          <h1 className="font-sans font-black text-4xl sm:text-6xl text-[var(--color-ink)] tracking-tight flex items-center justify-center gap-3">
            <Atom className="w-10 h-10 sm:w-12 sm:h-12 text-[var(--color-primary)]" />
            AgriDash <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)]">&amp; OmniDash</span>
          </h1>

          <p className="font-sans text-lg sm:text-xl text-[var(--color-ink)]/75 max-w-2xl mx-auto text-balance">
            Research, visualize, and master <strong>any topic</strong> in seconds—science, agriculture, technology, finance, history, and healthcare—with automated interactive charts and data.
          </p>
        </div>

        {/* Search & Document Context Box */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-3xl p-6 sm:p-10 shadow-2xl shadow-[var(--color-primary)]/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--color-accent)]/10 to-transparent rounded-bl-full -z-10"></div>

          <SearchBox fileId={fileId} selectedTopic={selectedTopic} />

          {/* Quick Discovery Topic Pills */}
          <div className="mt-6 pt-6 border-t border-[var(--color-rule)]/40">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/50 mb-3 text-center sm:text-left">
              Popular Research Topics:
            </div>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              {SUGGESTED_TOPICS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setSelectedTopic(t.label)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-bg)]/80 hover:bg-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/40 text-xs font-semibold text-[var(--color-ink)]/80 hover:text-[var(--color-primary)] transition-all cursor-pointer"
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                  <span className="opacity-40 text-[10px]">({t.category})</span>
                </button>
              ))}
            </div>
          </div>

          {/* File Upload Context Section */}
          <div className="mt-8 pt-8 border-t border-[var(--color-rule)]/50">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)]/50 mb-3 text-center sm:text-left">
              Upload Context Document (Optional PDF / DOCX):
            </div>
            <FileUpload onUploadComplete={(id) => setFileId(id)} />
          </div>
        </div>

        {/* Recent Discoveries */}
        {recentTopics.length > 0 && (
          <div className="pt-4">
            <h2 className="font-sans font-bold text-xl text-[var(--color-ink)] mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[var(--color-secondary)]" />
                Recent Dashboards
              </span>
              <Link
                href="/browse"
                className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:underline flex items-center gap-1 transition-colors bg-[var(--color-primary)]/10 px-4 py-2 rounded-full"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentTopics.map((topic, i) => (
                <Link
                  key={topic.slug}
                  href={`/dashboard/${topic.slug}`}
                  className="group relative block bg-[var(--color-surface)] border border-[var(--color-rule)] p-6 rounded-2xl hover:-translate-y-1.5 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-secondary)]/10 overflow-hidden"
                >
                  <div
                    className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                      i % 2 === 0
                        ? "from-[var(--color-primary)] to-[var(--color-secondary)]"
                        : "from-[var(--color-accent)] to-[var(--color-alert)]"
                    }`}
                  ></div>
                  <h3 className="font-sans font-bold text-lg text-[var(--color-ink)] capitalize truncate group-hover:text-[var(--color-primary)] transition-colors">
                    {topic.display_name}
                  </h3>
                  <div className="flex items-center justify-between mt-4">
                    <p className="font-mono text-xs text-[var(--color-ink)]/50 font-medium">
                      {new Date(topic.last_updated).toLocaleDateString()}
                    </p>
                    <div className="w-8 h-8 rounded-full bg-[var(--color-bg)] flex items-center justify-center group-hover:bg-[var(--color-primary)]/10 transition-colors">
                      <ArrowRight className="w-4 h-4 text-[var(--color-ink)]/50 group-hover:text-[var(--color-primary)]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
