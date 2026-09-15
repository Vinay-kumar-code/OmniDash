"use client";

import { useState } from "react";
import Link from "next/link";
import { Atom, Settings, Sun, Moon, Compass } from "lucide-react";
import { useTheme } from "next-themes";
import SettingsModal from "./SettingsModal";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-rule)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] group-hover:scale-110 transition-transform">
              <Atom className="w-5 h-5" />
            </div>
            <span className="font-sans font-black text-xl text-[var(--color-ink)] tracking-tight">
              OmniDash <span className="text-[var(--color-primary)]">AI</span>
            </span>
          </Link>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-3">
            <Link
              href="/browse"
              className="flex items-center gap-2 px-4 py-2 rounded-full font-sans text-sm font-semibold text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 transition-colors"
            >
              <Compass className="w-4 h-4 text-[var(--color-secondary)]" />
              <span className="hidden sm:inline">Browse</span>
            </Link>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-sans text-sm font-semibold text-[var(--color-ink)]/70 hover:text-[var(--color-ink)] hover:bg-[var(--color-rule)]/40 border border-[var(--color-rule)] transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-[var(--color-primary)]" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-full border border-[var(--color-rule)] bg-[var(--color-surface)] text-[var(--color-ink)]/80 hover:bg-[var(--color-rule)]/40 transition-all cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
