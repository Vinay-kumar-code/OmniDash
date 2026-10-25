"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useTheme } from "next-themes";

export default function DashboardFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const [frameHeight, setFrameHeight] = useState(1200);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync theme changes instantly into iframe without reloading srcDoc
  useEffect(() => {
    if (!mounted || !iframeRef.current) return;
    try {
      const doc = iframeRef.current.contentDocument;
      if (doc && doc.documentElement) {
        doc.documentElement.className = resolvedTheme === "dark" ? "dark" : "light";
      }
    } catch {}
  }, [resolvedTheme, mounted]);

  const updateIframeHeight = useCallback(() => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        const doc = iframe.contentDocument;
        const scrollH = Math.max(
          doc.body?.scrollHeight || 0,
          doc.documentElement?.scrollHeight || 0,
          850
        );
        setFrameHeight(scrollH + 40);
      }
    } catch {}
  }, []);

  const handleIframeLoad = () => {
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        const doc = iframe.contentDocument;
        doc.documentElement.className = resolvedTheme === "dark" ? "dark" : "light";

        updateIframeHeight();
        setTimeout(updateIframeHeight, 350);
        setTimeout(updateIframeHeight, 1200);

        if (iframe.contentWindow) {
          iframe.contentWindow.addEventListener("resize", updateIframeHeight);
        }
      }
    } catch {}
  };

  const wrappedHtml = `
    <!DOCTYPE html>
    <html class="${resolvedTheme === 'dark' ? 'dark' : 'light'}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            background-color: var(--color-bg, #ffffff);
            color: var(--color-ink, #000000);
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 16px;
            transition: background-color 0.2s ease, color 0.2s ease;
          }
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
              padding: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  return (
    <div className="w-full h-full min-h-screen bg-[var(--color-bg)] transition-colors">
      {mounted && (
        <iframe
          ref={iframeRef}
          srcDoc={wrappedHtml}
          onLoad={handleIframeLoad}
          sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-scripts"
          style={{ height: `${frameHeight}px` }}
          className="w-full border-none bg-transparent transition-all duration-200"
          title="OmniDash Intelligence Dashboard"
        />
      )}
    </div>
  );
}
