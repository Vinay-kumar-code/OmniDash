"use client";

import { useState, useEffect } from "react";
import SearchBox from "@/components/SearchBox";
import FileUpload from "@/components/FileUpload";
import Link from "next/link";
import { ArrowRight, Leaf, Sprout } from "lucide-react";

export default function Home() {
  const [fileId, setFileId] = useState<number | null>(null);
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="w-full max-w-4xl mx-auto space-y-12 py-12">
        <div className="text-center space-y-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[var(--color-primary)]/20 blur-3xl rounded-full -z-10"></div>
          <div className="absolute top-10 left-1/4 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[var(--color-secondary)]/10 blur-3xl rounded-full -z-10"></div>
          
          <h1 className="font-sans font-black text-6xl text-[var(--color-ink)] tracking-tight flex items-center justify-center gap-4">
            <Leaf className="w-12 h-12 text-[var(--color-primary)]" />
            AgriDash <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]">AI</span>
          </h1>
          <p className="font-sans text-xl text-[var(--color-ink)]/70 max-w-2xl mx-auto text-balance">
            Generate vibrant, interactive, and data-driven agricultural dashboards for any crop, instantly researched from the live web.
          </p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-3xl p-8 md:p-12 shadow-2xl shadow-[var(--color-primary)]/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[var(--color-accent)]/10 to-transparent rounded-bl-full -z-10"></div>
          
          <SearchBox fileId={fileId} />
          
          <div className="mt-8 pt-8 border-t border-[var(--color-rule)]/50">
            <FileUpload onUploadComplete={(id) => setFileId(id)} />
          </div>
        </div>

        {recentTopics.length > 0 && (
          <div className="pt-8">
            <h2 className="font-sans font-bold text-xl text-[var(--color-ink)] mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sprout className="w-6 h-6 text-[var(--color-secondary)]" /> 
                Recent Discoveries
              </span>
              <Link href="/browse" className="text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] hover:underline flex items-center gap-1 transition-colors bg-[var(--color-primary)]/10 px-4 py-2 rounded-full">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentTopics.map((topic, i) => (
                <Link
                  key={topic.slug}
                  href={`/dashboard/${topic.slug}`}
                  className="group relative block bg-[var(--color-surface)] border border-[var(--color-rule)] p-6 rounded-2xl hover:-translate-y-2 transition-all duration-300 hover:shadow-xl hover:shadow-[var(--color-secondary)]/10 overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${i % 2 === 0 ? 'from-[var(--color-primary)] to-[var(--color-secondary)]' : 'from-[var(--color-accent)] to-[var(--color-alert)]'}`}></div>
                  <h3 className="font-sans font-bold text-xl text-[var(--color-ink)] capitalize truncate group-hover:text-[var(--color-primary)] transition-colors">
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
