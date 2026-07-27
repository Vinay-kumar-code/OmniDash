"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

export default function DashboardFrame({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const wrappedHtml = `
    <!DOCTYPE html>
    <html class="${resolvedTheme === 'dark' ? 'dark' : 'light'}">
      <head>
        <meta charset="utf-8">
        <style>
          body {
            background-color: var(--color-bg, #ffffff);
            color: var(--color-ink, #000000);
            font-family: system-ui, -apple-system, sans-serif;
            margin: 0;
            padding: 16px;
          }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  return (
    <div className="w-full h-full min-h-screen bg-[var(--color-bg)]">
      {mounted && (
        <iframe
          ref={iframeRef}
          srcDoc={wrappedHtml}
          sandbox="allow-same-origin"
          className="w-full min-h-[1200px] border-none bg-transparent"
          title="AgriDash Dashboard"
        />
      )}
    </div>
  );
}
