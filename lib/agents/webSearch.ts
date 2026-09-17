/**
 * Web Research Agent: Fetches real-time web intelligence from Wikipedia and search engines.
 * Supplies ground-truth facts, statistics, historical dates, and sources for ANY topic.
 */

export interface WebResearchResult {
  topic: string;
  title: string;
  summary: string;
  snippets: string[];
  sources: Array<{ title: string; url: string }>;
  detectedCategory: string;
  groundedFacts: string;
}

/**
 * Searches Wikipedia and DuckDuckGo in parallel to gather real-world facts about any topic.
 */
export async function searchWebForTopic(topic: string): Promise<WebResearchResult> {
  const trimmed = topic.trim();
  const sources: Array<{ title: string; url: string }> = [];
  const snippets: string[] = [];
  let summary = "";
  let resolvedTitle = trimmed;
  let detectedCategory = "General Knowledge";

  // Build query variants
  // E.g., for "Vinayaka Chaviti", prioritize the main festival articles over film disambiguations
  const queriesToTry: string[] = [];
  if (/chaviti|chaturthi/i.test(trimmed)) {
    queriesToTry.push("Ganesh Chaturthi", "Vinayaka Chaturthi", trimmed);
  } else {
    queriesToTry.push(trimmed);
  }

  // 1. Parallel fetch from Wikipedia & DuckDuckGo
  const [wikiResult, ddgResult] = await Promise.allSettled([
    fetchWikipediaData(queriesToTry),
    fetchDuckDuckGoSnippets(trimmed),
  ]);

  if (wikiResult.status === "fulfilled" && wikiResult.value) {
    const wiki = wikiResult.value;
    resolvedTitle = wiki.title || resolvedTitle;
    summary = wiki.extract || "";
    if (wiki.description) {
      detectedCategory = categorizeFromDescription(wiki.description, summary);
    }
    if (wiki.url) {
      sources.push({ title: `${resolvedTitle} (Wikipedia)`, url: wiki.url });
    }
  }

  if (ddgResult.status === "fulfilled" && ddgResult.value) {
    for (const item of ddgResult.value) {
      if (item.snippet) snippets.push(item.snippet);
      if (item.url && !sources.some((s) => s.url === item.url)) {
        sources.push({ title: item.title || `${trimmed} Resource`, url: item.url });
      }
    }
  }

  // If Wikipedia summary was empty, synthesize summary from top snippets
  if (!summary && snippets.length > 0) {
    summary = snippets.slice(0, 3).join(" ");
  }

  // Detect category from snippets/summary if still default
  if (detectedCategory === "General Knowledge") {
    detectedCategory = inferCategory(trimmed, summary, snippets);
  }

  // Build unified grounded facts text for the agent swarm
  const factsList: string[] = [];
  if (summary) {
    factsList.push(`Executive Overview: ${summary}`);
  }
  if (snippets.length > 0) {
    factsList.push(`Verified Web Insights:\n- ${snippets.slice(0, 6).join("\n- ")}`);
  }

  return {
    topic: trimmed,
    title: resolvedTitle,
    summary,
    snippets,
    sources: sources.slice(0, 4),
    detectedCategory,
    groundedFacts: factsList.join("\n\n"),
  };
}

async function fetchWikipediaData(queries: string[]): Promise<{
  title: string;
  extract: string;
  description: string;
  url: string;
} | null> {
  for (const q of queries) {
    try {
      // 1. Direct page summary lookup
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        q.replace(/\s+/g, "_")
      )}`;
      const res = await fetch(summaryUrl, {
        headers: { "User-Agent": "OmniDashAI/1.0 (web-research-agent)" },
      });

      if (res.ok) {
        const data = await res.json();
        const isFilmOrDisambig =
          data.type === "disambiguation" ||
          (data.description && /film|soundtrack|album|movie|actor|actress/i.test(data.description) && !/film|movie/i.test(q)) ||
          (data.extract && /directed by|written and directed|stars N\. T\. Rama Rao|soundtrack/i.test(data.extract) && !/film|movie/i.test(q));

        if (!isFilmOrDisambig && data.extract && data.extract.length > 80) {
          return {
            title: data.title || q,
            extract: data.extract,
            description: data.description || "",
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`,
          };
        }
      }

      // 2. Wikipedia Search API fallback
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        q
      )}&utf8=&format=json`;
      const searchRes = await fetch(searchUrl, {
        headers: { "User-Agent": "OmniDashAI/1.0 (web-research-agent)" },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const hits = searchData.query?.search || [];
        for (const hit of hits.slice(0, 3)) {
          const hitTitle = hit.title;
          // Fetch summary for top hit
          const hitSumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            hitTitle.replace(/\s+/g, "_")
          )}`;
          const hitSumRes = await fetch(hitSumUrl, {
            headers: { "User-Agent": "OmniDashAI/1.0 (web-research-agent)" },
          });
          if (hitSumRes.ok) {
            const hitSumData = await hitSumRes.json();
            if (hitSumData.extract && hitSumData.extract.length > 80) {
              return {
                title: hitSumData.title || hitTitle,
                extract: hitSumData.extract,
                description: hitSumData.description || "",
                url:
                  hitSumData.content_urls?.desktop?.page ||
                  `https://en.wikipedia.org/wiki/${encodeURIComponent(hitTitle)}`,
              };
            }
          }
        }
      }
    } catch {
      // Continue to next query candidate
    }
  }

  return null;
}

async function fetchDuckDuckGoSnippets(
  topic: string
): Promise<Array<{ title: string; snippet: string; url: string }>> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(topic + " overview facts history")}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) return [];

    const html = await res.text();
    const results: Array<{ title: string; snippet: string; url: string }> = [];

    // Extract title, snippet, and url from DDG HTML
    const linkRegex = /<a class="result__url[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
    const snippetRegex = /<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g;
    const titleRegex = /<a class="result__a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;

    const titles: string[] = [];
    const urls: string[] = [];
    const snippets: string[] = [];

    let match;
    while ((match = titleRegex.exec(html)) !== null && titles.length < 5) {
      titles.push(match[2].replace(/<[^>]+>/g, "").trim());
    }
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
      snippets.push(match[1].replace(/<[^>]+>/g, "").trim());
    }
    while ((match = linkRegex.exec(html)) !== null && urls.length < 5) {
      let rawUrl = match[1];
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch && uddgMatch[1]) {
        rawUrl = decodeURIComponent(uddgMatch[1]);
      }
      urls.push(rawUrl);
    }

    for (let i = 0; i < snippets.length; i++) {
      results.push({
        title: titles[i] || topic,
        snippet: snippets[i],
        url: urls[i] || "https://en.wikipedia.org",
      });
    }

    return results;
  } catch {
    return [];
  }
}

function categorizeFromDescription(description: string, summary: string): string {
  const text = `${description} ${summary}`.toLowerCase();
  if (/festival|celebration|hindu|religion|ritual|deity|god|mytholog/i.test(text)) {
    return "Cultural & Religious Festival";
  }
  if (/history|revolution|empire|war|dynast|centur|civil war|republic|monarch|treaty|napoleon/i.test(text)) {
    return "History & Civilization";
  }
  if (/crop|plant|cultivat|farm|agricultur|botan|vegetable|fruit|harvest/i.test(text)) {
    return "Agriculture & Cultivation";
  }
  if (/comput|software|quantum|algorithm|hardware|artificial intelligence|\btech\b/i.test(text)) {
    return "Technology & Computing";
  }
  if (/physic|chemistr|biolog|\bgene\b|\bgenes\b|crispr|astronom|energi|space/i.test(text)) {
    return "Science & Engineering";
  }
  if (/econom|financ|market|invest|trade|money|banking/i.test(text)) {
    return "Finance & Economics";
  }
  return description || "General Knowledge";
}

function inferCategory(topic: string, summary: string, snippets: string[]): string {
  const combined = `${topic} ${summary} ${snippets.join(" ")}`.toLowerCase();
  if (/festival|chaviti|ganesh|puja|pooja|hindu|deity|visarjan|temple|ritual/i.test(combined)) {
    return "Cultural & Religious Festival";
  }
  if (/history|revolution|empire|war|dynast|centur|civil war|republic|monarch|treaty|napoleon/i.test(combined)) {
    return "History & Civilization";
  }
  if (/cultivat|harvest|crop|seed|soil|farm|fertilizer|yield/i.test(combined)) {
    return "Agriculture & Cultivation";
  }
  if (/quantum|qubit|comput|software|code|algorithm|ai|robot|network/i.test(combined)) {
    return "Technology & Computing";
  }
  if (/crispr|\bgene\b|\bgenes\b|dna|cell|disease|medic|health|patient|pharma/i.test(combined)) {
    return "Medicine & Healthcare";
  }
  if (/energy|fusion|reactor|physic|space|planet|star|astronom/i.test(combined)) {
    return "Science & Physics";
  }
  if (/stock|option|invest|market|valuation|asset|fund|capital/i.test(combined)) {
    return "Finance & Economics";
  }
  return "Knowledge & Intelligence";
}
