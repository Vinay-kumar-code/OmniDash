"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share2, Check, Printer, RefreshCw, Sparkles } from "lucide-react";

interface DashboardToolbarProps {
  displayName: string;
  slug: string;
}

export default function DashboardToolbar({ displayName, slug }: DashboardToolbarProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRegenerate = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      // Re-trigger research
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: displayName }),
      });
      const data = await res.json();
      if (res.ok && data.researchId) {
        // Re-generate dashboard
        const genRes = await fetch("/api/dashboard/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ researchId: data.researchId, topicId: slug }),
        });
        if (genRes.ok) {
          router.refresh();
          // Reload page to re-render fresh iframe content
          window.location.reload();
        }
      }
    } catch (err) {
      console.error("Failed to regenerate dashboard:", err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-rule)] px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm sticky top-16 z-30 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/browse"
          className="text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 p-2 rounded-xl transition-colors flex items-center gap-1.5 font-sans text-xs font-bold"
          title="Back to All Dashboards"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Browse</span>
        </Link>
        <div className="h-4 w-px bg-[var(--color-rule)] hidden sm:block" />
        <h1 className="font-sans font-black text-base sm:text-lg text-[var(--color-ink)] truncate capitalize">
          {displayName}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-bg)] hover:bg-[var(--color-rule)]/40 text-[var(--color-ink)]/80 font-sans text-xs font-semibold transition-colors cursor-pointer"
          title="Copy shareable link"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5 text-[var(--color-secondary)]" />
              <span className="hidden md:inline">Share</span>
            </>
          )}
        </button>

        {/* Print / Save PDF */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-rule)] bg-[var(--color-bg)] hover:bg-[var(--color-rule)]/40 text-[var(--color-ink)]/80 font-sans text-xs font-semibold transition-colors cursor-pointer"
          title="Print or Save as PDF"
        >
          <Printer className="w-3.5 h-3.5 text-[var(--color-accent)]" />
          <span className="hidden md:inline">Export PDF</span>
        </button>

        {/* Regenerate / Update */}
        <button
          onClick={handleRegenerate}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-sans text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          title="Re-run research swarm & update dashboard"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">{refreshing ? "Refreshing..." : "Regenerate"}</span>
        </button>

        {/* New Search */}
        <Link
          href="/"
          className="flex items-center gap-1.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white px-3.5 py-1.5 rounded-xl font-sans text-xs font-bold shadow-sm hover:shadow transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Research</span>
        </Link>
      </div>
    </div>
  );
}
