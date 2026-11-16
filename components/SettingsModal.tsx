"use client";

import { useState, useEffect } from "react";
import {
  X,
  Key,
  Cpu,
  Sun,
  Moon,
  Check,
  ShieldAlert,
  Sparkles,
  Layers,
  RotateCcw,
  Activity,
  Loader2,
  Globe,
  ExternalLink,
  Search,
  Shield,
  Flame,
} from "lucide-react";
import { useTheme } from "next-themes";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_MODELS = [
  { label: "NVIDIA Nemotron 3.5 Lightning (Free - Tool Calling Verified)", value: "nvidia/nemotron-3.5-lightning:free" },
  { label: "Google Gemma 4 31B (Free)", value: "google/gemma-4-31b-it:free" },
  { label: "OpenRouter Auto Router", value: "openrouter/auto" },
  { label: "DeepSeek V3 / Chat (Fast & Accurate)", value: "deepseek/deepseek-chat" },
  { label: "Unbiased Pareto (200B+ Model)", value: "unbiased/pareto" },
  { label: "Claude 3.5 Sonnet (Paid)", value: "anthropic/claude-3.5-sonnet" },
  { label: "GPT-4o Mini (Paid)", value: "openai/gpt-4o-mini" },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // OpenRouter State
  const [apiKeyMasked, setApiKeyMasked] = useState("");
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Search Engine Preference
  const [searchProvider, setSearchProvider] = useState("auto");

  // Tavily State
  const [tavilyKeyMasked, setTavilyKeyMasked] = useState("");
  const [isTavilyKeySet, setIsTavilyKeySet] = useState(false);
  const [newTavilyKey, setNewTavilyKey] = useState("");
  const [testingTavilyKey, setTestingTavilyKey] = useState(false);
  const [testTavilyResult, setTestTavilyResult] = useState<{ success: boolean; message: string } | null>(null);

  // Brave Search State
  const [braveKeyMasked, setBraveKeyMasked] = useState("");
  const [isBraveKeySet, setIsBraveKeySet] = useState(false);
  const [newBraveKey, setNewBraveKey] = useState("");
  const [testingBraveKey, setTestingBraveKey] = useState(false);
  const [testBraveResult, setTestBraveResult] = useState<{ success: boolean; message: string } | null>(null);

  // Firecrawl State
  const [firecrawlKeyMasked, setFirecrawlKeyMasked] = useState("");
  const [isFirecrawlKeySet, setIsFirecrawlKeySet] = useState(false);
  const [newFirecrawlKey, setNewFirecrawlKey] = useState("");
  const [testingFirecrawlKey, setTestingFirecrawlKey] = useState(false);
  const [testFirecrawlResult, setTestFirecrawlResult] = useState<{ success: boolean; message: string } | null>(null);

  // Model & Cascade States
  const [model, setModel] = useState("unbiased/pareto");
  const [customModel, setCustomModel] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [fallbackText, setFallbackText] = useState("");

  // Modal Status States
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setIsApiKeySet(data.isApiKeySet);
        setApiKeyMasked(data.apiKeyMasked);

        setIsTavilyKeySet(Boolean(data.isTavilyKeySet));
        setTavilyKeyMasked(data.tavilyKeyMasked || "");

        setIsBraveKeySet(Boolean(data.isBraveKeySet));
        setBraveKeyMasked(data.braveKeyMasked || "");

        setIsFirecrawlKeySet(Boolean(data.isFirecrawlKeySet));
        setFirecrawlKeyMasked(data.firecrawlKeyMasked || "");

        setSearchProvider(data.searchProvider || "auto");

        const matchingPreset = PRESET_MODELS.find((m) => m.value === data.model);
        if (matchingPreset) {
          setModel(data.model);
          setIsCustom(false);
        } else {
          setModel("custom");
          setCustomModel(data.model);
          setIsCustom(true);
        }

        if (Array.isArray(data.fallbackModels)) {
          setFallbackText(data.fallbackModels.join("\n"));
        }
      }
    } catch (err) {
      console.error("Failed to load settings", err);
    }
  };

  const handleTestKey = async () => {
    setTestingKey(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "openrouter", apiKey: newApiKey.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || "Key validation failed." });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || "Connection failed." });
    } finally {
      setTestingKey(false);
    }
  };

  const handleTestTavilyKey = async () => {
    setTestingTavilyKey(true);
    setTestTavilyResult(null);
    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tavily", apiKey: newTavilyKey.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestTavilyResult({ success: true, message: data.message });
      } else {
        setTestTavilyResult({ success: false, message: data.error || "Tavily validation failed." });
      }
    } catch (err: any) {
      setTestTavilyResult({ success: false, message: err?.message || "Connection failed." });
    } finally {
      setTestingTavilyKey(false);
    }
  };

  const handleTestBraveKey = async () => {
    setTestingBraveKey(true);
    setTestBraveResult(null);
    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "brave", apiKey: newBraveKey.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestBraveResult({ success: true, message: data.message });
      } else {
        setTestBraveResult({ success: false, message: data.error || "Brave Search validation failed." });
      }
    } catch (err: any) {
      setTestBraveResult({ success: false, message: err?.message || "Connection failed." });
    } finally {
      setTestingBraveKey(false);
    }
  };

  const handleTestFirecrawlKey = async () => {
    setTestingFirecrawlKey(true);
    setTestFirecrawlResult(null);
    try {
      const res = await fetch("/api/settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "firecrawl", apiKey: newFirecrawlKey.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestFirecrawlResult({ success: true, message: data.message });
      } else {
        setTestFirecrawlResult({ success: false, message: data.error || "Firecrawl validation failed." });
      }
    } catch (err: any) {
      setTestFirecrawlResult({ success: false, message: err?.message || "Connection failed." });
    } finally {
      setTestingFirecrawlKey(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaveSuccess(false);

    const activeModel = isCustom ? customModel.trim() : model;

    if (!activeModel) {
      setError("Please specify a valid model code.");
      setLoading(false);
      return;
    }

    const parsedFallbacks = fallbackText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: newApiKey.trim() || undefined,
          tavilyApiKey: newTavilyKey.trim() || undefined,
          braveApiKey: newBraveKey.trim() || undefined,
          firecrawlApiKey: newFirecrawlKey.trim() || undefined,
          searchProvider,
          model: activeModel,
          fallbackModels: parsedFallbacks,
        }),
      });

      const resText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch {
        data = { error: `Server error (${res.status})` };
      }

      if (res.ok) {
        setIsApiKeySet(data.isApiKeySet);
        setApiKeyMasked(data.apiKeyMasked);

        setIsTavilyKeySet(Boolean(data.isTavilyKeySet));
        setTavilyKeyMasked(data.tavilyKeyMasked || "");

        setIsBraveKeySet(Boolean(data.isBraveKeySet));
        setBraveKeyMasked(data.braveKeyMasked || "");

        setIsFirecrawlKeySet(Boolean(data.isFirecrawlKeySet));
        setFirecrawlKeyMasked(data.firecrawlKeyMasked || "");

        setSearchProvider(data.searchProvider || "auto");

        if (Array.isArray(data.fallbackModels)) {
          setFallbackText(data.fallbackModels.join("\n"));
        }
        setNewApiKey("");
        setNewTavilyKey("");
        setNewBraveKey("");
        setNewFirecrawlKey("");
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(data.error || "Failed to save settings.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl bg-[var(--color-surface)] border border-[var(--color-rule)] rounded-3xl shadow-2xl overflow-hidden text-[var(--color-ink)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-rule)] bg-[var(--color-bg)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="font-sans font-bold text-xl">App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--color-rule)]/50 text-[var(--color-ink)]/60 hover:text-[var(--color-ink)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* API Key Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-sans font-bold text-sm text-[var(--color-ink)]">
              <Key className="w-4 h-4 text-[var(--color-primary)]" />
              OpenRouter API Key
            </label>

            {isApiKeySet && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-xs font-mono">
                <span className="text-[var(--color-ink)]/70">Current Active Key:</span>
                <span className="font-bold text-[var(--color-primary)] tracking-wider">{apiKeyMasked}</span>
              </div>
            )}

            <div className="space-y-2">
              <input
                type="password"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
                placeholder={isApiKeySet ? "Enter new API key to replace existing..." : "sk-or-v1-..."}
                className="w-full px-4 py-3 text-sm font-mono border border-[var(--color-rule)] rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] placeholder:text-[var(--color-ink)]/30"
              />
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={testingKey || (!isApiKeySet && !newApiKey.trim())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                >
                  {testingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                  {testingKey ? "Testing..." : "Test Connection"}
                </button>
                {testResult && (
                  <span
                    className={`text-xs font-sans ${
                      testResult.success ? "text-emerald-500 font-semibold" : "text-red-500 font-medium"
                    }`}
                  >
                    {testResult.message}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-ink)]/50 flex items-center gap-1 pt-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                For security, your current key is hidden. Leave empty to keep existing key.
              </p>
            </div>
          </div>

          <hr className="border-[var(--color-rule)]" />

          {/* Web Search & Grounding Engine Section Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-sans font-bold text-base text-[var(--color-ink)]">
              <Search className="w-4 h-4 text-cyan-500" />
              Web Search &amp; Grounding Engines
            </div>
            <p className="text-xs text-[var(--color-ink)]/60 leading-relaxed">
              Connect external search APIs for real-time live grounding. Connect any or all engines: Tavily, Brave Search, or Firecrawl.
            </p>
          </div>

          {/* Preferred Search Provider Selector */}
          <div className="space-y-2 p-4 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-rule)]">
            <label className="font-sans font-bold text-xs uppercase tracking-wider text-[var(--color-ink)]/70">
              Primary Search Provider
            </label>
            <select
              value={searchProvider}
              onChange={(e) => setSearchProvider(e.target.value)}
              className="w-full px-3 py-2 text-sm font-sans border border-[var(--color-rule)] rounded-xl bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="auto">Auto (Best Available: Tavily → Brave → Firecrawl → Built-in)</option>
              <option value="tavily">Tavily AI Search (Deep Research Engine)</option>
              <option value="brave">Brave Search API (Global Web Index)</option>
              <option value="firecrawl">Firecrawl API (Deep Scrape &amp; Search)</option>
              <option value="wikipedia_ddg">Built-in (Wikipedia &amp; DuckDuckGo Only)</option>
            </select>
          </div>

          {/* 1. Tavily Search API Key */}
          <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-rule)]">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-sans font-bold text-sm text-[var(--color-ink)]">
                <Globe className="w-4 h-4 text-cyan-500" />
                Tavily Search API Key
              </label>
              <a
                href="https://tavily.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
              >
                <span>tavily.com</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {isTavilyKeySet ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-mono">
                <span className="text-[var(--color-ink)]/70">Active Tavily Key:</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 tracking-wider">{tavilyKeyMasked}</span>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-neutral-500/10 border border-neutral-500/20 text-xs text-[var(--color-ink)]/60 font-sans">
                No Tavily key set.
              </div>
            )}

            <div className="space-y-2">
              <input
                type="password"
                value={newTavilyKey}
                onChange={(e) => setNewTavilyKey(e.target.value)}
                placeholder={isTavilyKeySet ? "Enter new key to replace existing..." : "tvly-..."}
                className="w-full px-4 py-2.5 text-sm font-mono border border-[var(--color-rule)] rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder:text-[var(--color-ink)]/30"
              />
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestTavilyKey}
                  disabled={testingTavilyKey || (!isTavilyKeySet && !newTavilyKey.trim())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                >
                  {testingTavilyKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                  {testingTavilyKey ? "Testing..." : "Test Tavily"}
                </button>
                {testTavilyResult && (
                  <span
                    className={`text-xs font-sans ${
                      testTavilyResult.success ? "text-emerald-500 font-semibold" : "text-red-500 font-medium"
                    }`}
                  >
                    {testTavilyResult.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 2. Brave Search API Key */}
          <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-rule)]">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-sans font-bold text-sm text-[var(--color-ink)]">
                <Shield className="w-4 h-4 text-orange-500" />
                Brave Search API Key
              </label>
              <a
                href="https://brave.com/search/api/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-orange-500 hover:underline flex items-center gap-1 font-medium"
              >
                <span>brave.com/search/api</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {isBraveKeySet ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-xs font-mono">
                <span className="text-[var(--color-ink)]/70">Active Brave Key:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400 tracking-wider">{braveKeyMasked}</span>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-neutral-500/10 border border-neutral-500/20 text-xs text-[var(--color-ink)]/60 font-sans">
                No Brave Search key set.
              </div>
            )}

            <div className="space-y-2">
              <input
                type="password"
                value={newBraveKey}
                onChange={(e) => setNewBraveKey(e.target.value)}
                placeholder={isBraveKeySet ? "Enter new key to replace existing..." : "BSA..."}
                className="w-full px-4 py-2.5 text-sm font-mono border border-[var(--color-rule)] rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-[var(--color-ink)]/30"
              />
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestBraveKey}
                  disabled={testingBraveKey || (!isBraveKeySet && !newBraveKey.trim())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                >
                  {testingBraveKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                  {testingBraveKey ? "Testing..." : "Test Brave Search"}
                </button>
                {testBraveResult && (
                  <span
                    className={`text-xs font-sans ${
                      testBraveResult.success ? "text-emerald-500 font-semibold" : "text-red-500 font-medium"
                    }`}
                  >
                    {testBraveResult.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Firecrawl API Key */}
          <div className="space-y-3 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-rule)]">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-sans font-bold text-sm text-[var(--color-ink)]">
                <Flame className="w-4 h-4 text-rose-500" />
                Firecrawl API Key (Deep Scrape &amp; Search)
              </label>
              <a
                href="https://firecrawl.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-medium"
              >
                <span>firecrawl.dev</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {isFirecrawlKeySet ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-mono">
                <span className="text-[var(--color-ink)]/70">Active Firecrawl Key:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 tracking-wider">{firecrawlKeyMasked}</span>
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-neutral-500/10 border border-neutral-500/20 text-xs text-[var(--color-ink)]/60 font-sans">
                No Firecrawl key set.
              </div>
            )}

            <div className="space-y-2">
              <input
                type="password"
                value={newFirecrawlKey}
                onChange={(e) => setNewFirecrawlKey(e.target.value)}
                placeholder={isFirecrawlKeySet ? "Enter new key to replace existing..." : "fc-..."}
                className="w-full px-4 py-2.5 text-sm font-mono border border-[var(--color-rule)] rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-rose-500 placeholder:text-[var(--color-ink)]/30"
              />
              <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestFirecrawlKey}
                  disabled={testingFirecrawlKey || (!isFirecrawlKeySet && !newFirecrawlKey.trim())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                >
                  {testingFirecrawlKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                  {testingFirecrawlKey ? "Testing..." : "Test Firecrawl"}
                </button>
                {testFirecrawlResult && (
                  <span
                    className={`text-xs font-sans ${
                      testFirecrawlResult.success ? "text-emerald-500 font-semibold" : "text-red-500 font-medium"
                    }`}
                  >
                    {testFirecrawlResult.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <hr className="border-[var(--color-rule)]" />

          {/* Model Selection Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-sans font-bold text-sm text-[var(--color-ink)]">
              <Cpu className="w-4 h-4 text-[var(--color-secondary)]" />
              OpenRouter AI Model Code
            </label>

            <select
              value={isCustom ? "custom" : model}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "custom") {
                  setIsCustom(true);
                } else {
                  setIsCustom(false);
                  setModel(val);
                }
              }}
              className="w-full px-4 py-3 text-sm font-sans border border-[var(--color-rule)] rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)]"
            >
              {PRESET_MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label} ({m.value})
                </option>
              ))}
              <option value="custom">Enter Custom Model Code...</option>
            </select>

            {isCustom && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. meta-llama/llama-3.3-70b-instruct:free"
                className="w-full px-4 py-3 text-sm font-mono border border-[var(--color-rule)] rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-secondary)] placeholder:text-[var(--color-ink)]/30 mt-2"
              />
            )}
            <p className="text-xs text-[var(--color-ink)]/50">
              Select any free or paid model available on OpenRouter.
            </p>
          </div>

          <hr className="border-[var(--color-rule)]" />

          {/* Fallback Models Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 font-sans font-bold text-sm text-[var(--color-ink)]">
                <Layers className="w-4 h-4 text-emerald-500" />
                Fallback Models Cascade (Failover Order)
              </label>
              <button
                type="button"
                onClick={() =>
                  setFallbackText("unbiased/pareto\ndeepseek/deepseek-chat\nopenrouter/auto")
                }
                className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>

            <p className="text-xs text-[var(--color-ink)]/60 leading-relaxed">
              If the primary model rate-limits, errors, or fails to output structured JSON, the 3-agent research swarm automatically cascades through these backup models in order:
            </p>

            <textarea
              rows={3}
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              placeholder="one model per line, e.g.&#10;deepseek/deepseek-chat&#10;meta-llama/llama-3.3-70b-instruct:free&#10;openrouter/auto"
              className="w-full px-4 py-3 text-xs font-mono border border-[var(--color-rule)] rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-[var(--color-ink)]/30 leading-relaxed"
            />
          </div>

          <hr className="border-[var(--color-rule)]" />

          {/* Theme Toggle Section */}
          <div className="space-y-3">
            <label className="font-sans font-bold text-sm text-[var(--color-ink)] block">
              Theme Preference
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  theme === "light"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm"
                    : "border-[var(--color-rule)] bg-[var(--color-bg)] text-[var(--color-ink)]/70 hover:bg-[var(--color-surface)]"
                }`}
              >
                <Sun className="w-4 h-4" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                  theme === "dark"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)] shadow-sm"
                    : "border-[var(--color-rule)] bg-[var(--color-bg)] text-[var(--color-ink)]/70 hover:bg-[var(--color-surface)]"
                }`}
              >
                <Moon className="w-4 h-4" />
                Dark
              </button>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
              <Check className="w-4 h-4" />
              Settings saved successfully!
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-rule)]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-[var(--color-rule)] text-sm font-medium hover:bg-[var(--color-rule)]/50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-lg shadow-[var(--color-primary)]/20"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
