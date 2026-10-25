"use client";

import { useState, useEffect } from "react";
import { X, Key, Cpu, Sun, Moon, Check, ShieldAlert, Sparkles, Layers, RotateCcw, Activity, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_MODELS = [
  { label: "Unbiased Pareto (200B+ Model - Recommended)", value: "unbiased/pareto" },
  { label: "DeepSeek V3 / Chat (Fast & Accurate)", value: "deepseek/deepseek-chat" },
  { label: "OpenRouter Auto Router", value: "openrouter/auto" },
  { label: "Llama 3.3 70B Instruct (Free)", value: "meta-llama/llama-3.3-70b-instruct:free" },
  { label: "Llama 3.3 70B Instruct", value: "meta-llama/llama-3.3-70b-instruct" },
  { label: "Claude 3.5 Sonnet (Paid)", value: "anthropic/claude-3.5-sonnet" },
  { label: "GPT-4o Mini (Paid)", value: "openai/gpt-4o-mini" },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [apiKeyMasked, setApiKeyMasked] = useState("");
  const [isApiKeySet, setIsApiKeySet] = useState(false);
  const [newApiKey, setNewApiKey] = useState("");
  const [model, setModel] = useState("unbiased/pareto");
  const [customModel, setCustomModel] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [fallbackText, setFallbackText] = useState("");
  const [loading, setLoading] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
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
        body: JSON.stringify({ apiKey: newApiKey.trim() || undefined }),
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
        if (Array.isArray(data.fallbackModels)) {
          setFallbackText(data.fallbackModels.join("\n"));
        }
        setNewApiKey(""); // Clear the input field for security
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
                onClick={() => setFallbackText("unbiased/pareto\ndeepseek/deepseek-chat\nopenrouter/auto\nmeta-llama/llama-3.3-70b-instruct:free")}
                className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Defaults
              </button>
            </div>

            <p className="text-xs text-[var(--color-ink)]/60 leading-relaxed">
              When the primary model experiences rate limits, 404s, or timeouts, the research swarm automatically cascades through these backup models in order (one per line).
            </p>

            <textarea
              rows={3}
              value={fallbackText}
              onChange={(e) => setFallbackText(e.target.value)}
              placeholder="unbiased/pareto&#10;deepseek/deepseek-chat&#10;openrouter/auto&#10;meta-llama/llama-3.3-70b-instruct:free"
              className="w-full px-4 py-2.5 text-xs font-mono border border-[var(--color-rule)] rounded-xl bg-[var(--color-bg)] text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-[var(--color-ink)]/30 resize-y"
            />

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-[var(--color-ink)]/50 font-medium mr-1">Quick add:</span>
              {[
                "unbiased/pareto",
                "deepseek/deepseek-chat",
                "openrouter/auto",
                "meta-llama/llama-3.3-70b-instruct:free",
                "meta-llama/llama-3.3-70b-instruct",
                "qwen/qwen-2.5-72b-instruct",
              ].map((m) => {
                const isAlreadyAdded = fallbackText
                  .split(/[\n,]+/)
                  .map((s) => s.trim())
                  .includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => {
                      if (!isAlreadyAdded) {
                        setFallbackText((prev) =>
                          prev.trim() ? `${prev.trim()}\n${m}` : m
                        );
                      }
                    }}
                    className={`px-2 py-1 text-[11px] rounded-lg border transition-colors ${
                      isAlreadyAdded
                        ? "opacity-40 cursor-not-allowed border-[var(--color-rule)] text-[var(--color-ink)]/40"
                        : "border-[var(--color-rule)] hover:border-emerald-500/50 bg-[var(--color-bg)] hover:bg-emerald-500/10 text-[var(--color-ink)]/80"
                    }`}
                  >
                    + {m.split("/")[1] || m}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-[var(--color-rule)]" />

          {/* Theme Section */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 font-sans font-bold text-sm text-[var(--color-ink)]">
              <Sun className="w-4 h-4 text-[var(--color-accent)]" />
              Appearance Theme
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-sans text-sm font-semibold transition-all ${
                  theme === "light"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "border-[var(--color-rule)] bg-[var(--color-bg)] text-[var(--color-ink)]/70 hover:bg-[var(--color-rule)]/30"
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                Light Mode
              </button>

              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-sans text-sm font-semibold transition-all ${
                  theme === "dark"
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "border-[var(--color-rule)] bg-[var(--color-bg)] text-[var(--color-ink)]/70 hover:bg-[var(--color-rule)]/30"
                }`}
              >
                <Moon className="w-4 h-4 text-indigo-400" />
                Dark Mode
              </button>
            </div>
          </div>

          {/* Error / Success Feedback */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-sans">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-xs font-sans font-semibold">
              <Check className="w-4 h-4" />
              Settings saved successfully!
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-sans text-sm font-semibold text-[var(--color-ink)]/70 hover:bg-[var(--color-rule)]/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-sans text-sm font-bold bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
