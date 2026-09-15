"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  fileId: number | null;
  selectedTopic?: string;
}

export default function SearchBox({ fileId, selectedTopic }: SearchBoxProps) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (selectedTopic) {
      setTopic(selectedTopic);
    }
  }, [selectedTopic]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const researchRes = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), fileId }),
      });

      const researchData = await researchRes.json();

      if (!researchRes.ok) {
        setError(researchData.error || "Failed to generate research data.");
        return;
      }

      const { researchId, slug } = researchData;

      if (researchId && slug) {
        const dashRes = await fetch("/api/dashboard/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ researchId, topicId: slug }),
        });

        const dashData = await dashRes.json();
        if (dashRes.ok) {
          router.push(`/dashboard/${slug}`);
        } else {
          setError(dashData.error || "Failed to generate visual dashboard.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <div className="relative w-full group">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] rounded-2xl blur-md opacity-25 group-hover:opacity-40 transition duration-500"></div>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Research any topic (e.g. Quantum Computing, Tomato Farming, CRISPR, French Revolution)..."
          className="relative w-full pl-14 pr-6 py-5 text-base sm:text-lg border border-[var(--color-rule)] rounded-2xl bg-[var(--color-surface)] shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:text-[var(--color-ink)]/40 font-sans transition-all"
          disabled={loading}
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-primary)] w-6 h-6" />
      </div>

      <button
        type="submit"
        disabled={loading || !topic.trim()}
        className="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white px-10 py-4 rounded-full font-sans font-bold text-lg hover:shadow-xl hover:shadow-[var(--color-primary)]/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none min-w-[240px]"
      >
        {loading ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Researching & Generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span>Generate Intelligence Dashboard</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-6 w-full max-w-lg p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl text-center text-sm font-sans">
          {error}
        </div>
      )}
    </form>
  );
}
