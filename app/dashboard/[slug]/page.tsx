import db from "@/lib/db";
import DashboardFrame from "@/components/DashboardFrame";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function DashboardPage({ params }: PageProps) {
  const { slug } = await params;

  // Fetch the latest dashboard for this topic
  const dashboard = db.prepare(`
    SELECT d.html_content, t.display_name
    FROM dashboards d
    JOIN topics t ON d.topic_id = t.id
    WHERE t.slug = ?
    ORDER BY d.created_at DESC
    LIMIT 1
  `).get(slug) as any;

  if (!dashboard) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <div className="bg-[var(--color-surface)] border-b border-[var(--color-rule)] p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 p-2 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-sans font-bold text-lg text-[var(--color-ink)] capitalize">
            {dashboard.display_name} Dashboard
          </h1>
        </div>
        <Link 
          href="/"
          className="font-sans text-sm font-semibold border border-[var(--color-ink)] px-4 py-1.5 hover:bg-[var(--color-ink)] hover:text-white transition-colors"
        >
          New Search
        </Link>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <DashboardFrame html={dashboard.html_content} />
      </div>
    </main>
  );
}
