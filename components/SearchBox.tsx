"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Sparkles, CheckCircle2, Bot, Layers, TrendingUp, LayoutDashboard, AlertTriangle, Globe } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchBoxProps {
  fileId: number | null;
  selectedTopic?: string;
}

interface AgentState {
  id: string;
  name: string;
  role: string;
  status: "idle" | "working" | "done" | "fallback";
}

/**
 * Safely parse response text into JSON.
 * Protects against upstream reverse-proxy HTML errors (e.g. 504 Gateway Timeout or 502 Bad Gateway)
 * that cause "Unexpected token '<', '<html> <h'..." syntax errors.
 */
async function parseSafeResponse(res: Response, stageName: string): Promise<any> {
  const text = await res.text();

  try {
    return JSON.parse(text);
  } catch (parseErr) {
    console.error(`Non-JSON response received during ${stageName} (Status ${res.status}):`, text.slice(0, 300));
    if (text.includes("<html") || res.status === 504 || res.status === 502) {
      throw new Error(
        `The upstream AI gateway timed out (HTTP ${res.status}). The platform has reset with fast-track mode—please submit again.`
      );
    }
    throw new Error(
      `Server returned an unparseable response (${res.status}). Please check network or model availability.`
    );
  }
}

export default function SearchBox({ fileId, selectedTopic }: SearchBoxProps) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [agents, setAgents] = useState<AgentState[]>([
    { id: "agent_web", name: "Web Research Agent", role: "Live Encyclopedic & Fact Search", status: "idle" },
    { id: "agent1", name: "Agent 1: Foundations", role: "Overview, KPIs & Core Concepts", status: "idle" },
    { id: "agent2", name: "Agent 2: Lifecycle", role: "Chronology & Practical Solutions", status: "idle" },
    { id: "agent3", name: "Agent 3: Strategy", role: "Trade-offs, Risks & Verified Sources", status: "idle" },
    { id: "agent4", name: "Dashboard Engine", role: "Interactive Visual Architecture", status: "idle" },
  ]);

  const router = useRouter();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedTopic) {
      setTopic(selectedTopic);
    }
  }, [selectedTopic]);

  useEffect(() => {
    if (loading) {
      setElapsedSec(0);
      timerRef.current = setInterval(() => {
        setElapsedSec((s) => +(s + 0.5).toFixed(1));
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    // Set agents to working
    setAgents([
      { id: "agent_web", name: "Web Research Agent", role: "Live Encyclopedic & Fact Search", status: "working" },
      { id: "agent1", name: "Agent 1: Foundations", role: "Overview, KPIs & Core Concepts", status: "working" },
      { id: "agent2", name: "Agent 2: Lifecycle", role: "Chronology & Practical Solutions", status: "working" },
      { id: "agent3", name: "Agent 3: Strategy", role: "Trade-offs, Risks & Verified Sources", status: "working" },
      { id: "agent4", name: "Dashboard Engine", role: "Interactive Visual Architecture", status: "idle" },
    ]);

    try {
      // Step 1: Execute Web Research + 3-Agent Parallel Research Swarm
      const researchRes = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), fileId }),
      });

      const researchData = await parseSafeResponse(researchRes, "Research Swarm");

      if (!researchRes.ok) {
        throw new Error(researchData.error || "Failed to generate research data.");
      }

      const { researchId, slug, agents: agentStats } = researchData;

      // Update agent statuses based on server swarm result
      setAgents([
        {
          id: "agent_web",
          name: "Web Research Agent",
          role: "Live Encyclopedic & Fact Search",
          status: "done",
        },
        {
          id: "agent1",
          name: "Agent 1: Foundations",
          role: "Overview, KPIs & Core Concepts",
          status: agentStats?.agent1_foundations ? "done" : "fallback",
        },
        {
          id: "agent2",
          name: "Agent 2: Lifecycle",
          role: "Chronology & Practical Solutions",
          status: agentStats?.agent2_execution ? "done" : "fallback",
        },
        {
          id: "agent3",
          name: "Agent 3: Strategy",
          role: "Trade-offs, Risks & Verified Sources",
          status: agentStats?.agent3_strategy ? "done" : "fallback",
        },
        {
          id: "agent4",
          name: "Dashboard Engine",
          role: "Interactive Visual Architecture",
          status: "working",
        },
      ]);

      // Step 2: Build the High-Performance Visual Dashboard
      if (researchId && slug) {
        const dashRes = await fetch("/api/dashboard/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ researchId, topicId: slug }),
        });

        const dashData = await parseSafeResponse(dashRes, "Dashboard Generator");

        if (dashRes.ok && dashData.success) {
          setAgents((prev) =>
            prev.map((a) => (a.id === "agent4" ? { ...a, status: "done" } : a))
          );
          // Navigate to completed dashboard
          router.push(`/dashboard/${slug}`);
        } else {
          throw new Error(dashData.error || "Failed to build visual dashboard.");
        }
      } else {
        throw new Error("Invalid research response: missing IDs.");
      }
    } catch (err: any) {
      console.error("[SearchBox Error]:", err);
      setError(err?.message || "An unexpected error occurred.");
      setAgents((prev) => prev.map((a) => ({ ...a, status: "idle" })));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      <form onSubmit={handleSearch} className="w-full flex flex-col items-center">
        <div className="relative w-full group">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-[var(--color-secondary)] to-[var(--color-accent)] rounded-2xl blur-md opacity-25 group-hover:opacity-40 transition duration-500"></div>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Research any topic (e.g. Vinayaka Chaviti, Quantum Computing, CRISPR)..."
            className="relative w-full pl-14 pr-6 py-5 text-base sm:text-lg border border-[var(--color-rule)] rounded-2xl bg-[var(--color-surface)] shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:text-[var(--color-ink)]/40 font-sans transition-all"
            disabled={loading}
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-primary)] w-6 h-6" />
        </div>

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="mt-6 flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white px-10 py-4 rounded-full font-sans font-bold text-lg hover:shadow-xl hover:shadow-[var(--color-primary)]/30 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none min-w-[280px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Multi-Agent Swarm Active ({elapsedSec}s)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Intelligence Dashboard</span>
            </>
          )}
        </button>
      </form>

      {/* Live Parallel Agents Monitor */}
      {loading && (
        <div className="mt-8 w-full bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-2xl p-5 shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between border-b border-[var(--color-rule)] pb-3 mb-4">
            <div className="flex items-center gap-2 font-sans font-bold text-sm text-[var(--color-ink)]">
              <Sparkles className="w-4 h-4 text-[var(--color-primary)] animate-pulse" />
              <span>Spawning Web Agent + 3 Parallel Swarm Agents</span>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold">
              {elapsedSec}s elapsed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {agents.map((agent) => {
              const isWorking = agent.status === "working";
              const isDone = agent.status === "done" || agent.status === "fallback";

              let IconComponent = Bot;
              if (agent.id === "agent_web") IconComponent = Globe;
              if (agent.id === "agent1") IconComponent = Bot;
              if (agent.id === "agent2") IconComponent = Layers;
              if (agent.id === "agent3") IconComponent = TrendingUp;
              if (agent.id === "agent4") IconComponent = LayoutDashboard;

              return (
                <div
                  key={agent.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isWorking
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-sm"
                      : isDone
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-[var(--color-rule)]/50 opacity-50 bg-[var(--color-bg)]"
                  }`}
                >
                  <div className="mt-0.5">
                    {isWorking && (
                      <Loader2 className="w-4 h-4 text-[var(--color-primary)] animate-spin" />
                    )}
                    {isDone && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    {!isWorking && !isDone && (
                      <IconComponent className="w-4 h-4 text-[var(--color-ink)]/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-xs font-bold text-[var(--color-ink)] flex items-center justify-between">
                      <span className="truncate">{agent.name}</span>
                      <span
                        className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                          isWorking
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse"
                            : isDone
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : "bg-slate-500/10 text-slate-500"
                        }`}
                      >
                        {isWorking ? "Active" : isDone ? "Done" : "Queued"}
                      </span>
                    </div>
                    <p className="font-sans text-[11px] text-[var(--color-ink)]/60 mt-0.5 truncate">
                      {agent.role}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-6 w-full max-w-lg p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl text-center text-sm font-sans flex items-center gap-3 justify-center">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-left">{error}</span>
        </div>
      )}
    </div>
  );
}
