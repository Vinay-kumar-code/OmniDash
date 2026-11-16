/**
 * Web Research Agent: Fetches real-time web intelligence from Wikipedia and search engines.
 * Supplies ground-truth facts, statistics, historical dates, and sources for ANY topic.
 */

import { getTavilyApiKey } from "../settings";

export interface WebResearchResult {
  topic: string;
  title: string;
  summary: string;
  snippets: string[];
  sources: Array<{ title: string; url: string }>;
  detectedCategory: string;
  groundedFacts: string;
  engineUsed: "tavily" | "wikipedia_ddg";
}

/**
 * Searches real-time web intelligence using Tavily Search API as primary engine,
 * with resilient Wikipedia and DuckDuckGo fallbacks.
 */
export async function searchWebForTopic(
  topic: string,
  providedTavilyKey?: string
): Promise<WebResearchResult> {
  const trimmed = topic.trim();
  const sources: Array<{ title: string; url: string }> = [];
  const snippets: string[] = [];
  let summary = "";
  let resolvedTitle = trimmed;
  let detectedCategory = "General Knowledge";
  let engineUsed: "tavily" | "wikipedia_ddg" = "wikipedia_ddg";

  // Build query variants for specific terms (e.g. festivals)
  const queriesToTry: string[] = [];
  if (/chaviti|chaturthi/i.test(trimmed)) {
    queriesToTry.push("Ganesh Chaturthi", "Vinayaka Chaturthi", trimmed);
  } else {
    queriesToTry.push(trimmed);
  }

  const tavilyKey = (providedTavilyKey || getTavilyApiKey()).trim();

  // 1. If Tavily API Key is available, use Tavily AI Search as primary
  if (tavilyKey) {
    console.log(`[WebResearchAgent] Querying Tavily AI Search for "${trimmed}"...`);
    const [tavilyResult, wikiResult] = await Promise.allSettled([
      fetchTavilySearch(trimmed, tavilyKey),
      fetchWikipediaData(queriesToTry),
    ]);

    if (tavilyResult.status === "fulfilled" && tavilyResult.value) {
      const tav = tavilyResult.value;
      engineUsed = "tavily";
      if (tav.answer) {
        summary = tav.answer;
      }
      for (const snip of tav.snippets) {
        snippets.push(snip);
      }
      for (const src of tav.sources) {
        if (!sources.some((s) => s.url === src.url)) {
          sources.push(src);
        }
      }
    }

    if (wikiResult.status === "fulfilled" && wikiResult.value) {
      const wiki = wikiResult.value;
      resolvedTitle = wiki.title || resolvedTitle;
      if (!summary) {
        summary = wiki.extract || "";
      }
      if (wiki.url && !sources.some((s) => s.url === wiki.url)) {
        sources.push({ title: `${resolvedTitle} (Wikipedia)`, url: wiki.url });
      }
      if (wiki.description) {
        detectedCategory = categorizeFromDescription(wiki.description, summary);
      }
    }
  }

  // 2. Fallback to Wikipedia + DuckDuckGo if Tavily was not used or yielded no snippets
  if (snippets.length === 0) {
    console.log(`[WebResearchAgent] Running Wikipedia & DuckDuckGo search fallback for "${trimmed}"...`);
    const [wikiResult, ddgResult] = await Promise.allSettled([
      summary ? Promise.resolve(null) : fetchWikipediaData(queriesToTry),
      fetchDuckDuckGoSnippets(trimmed),
    ]);

    if (wikiResult.status === "fulfilled" && wikiResult.value) {
      const wiki = wikiResult.value;
      resolvedTitle = wiki.title || resolvedTitle;
      if (!summary) summary = wiki.extract || "";
      if (wiki.description) {
        detectedCategory = categorizeFromDescription(wiki.description, summary);
      }
      if (wiki.url && !sources.some((s) => s.url === wiki.url)) {
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
  }

  // If summary is still empty, synthesize from top snippets
  if (!summary && snippets.length > 0) {
    summary = snippets.slice(0, 3).join(" ");
  }

  // Detect category from snippets/summary
  if (detectedCategory === "General Knowledge") {
    detectedCategory = inferCategory(trimmed, summary, snippets);
  }

  // Build unified grounded facts text for the agent swarm
  const factsList: string[] = [];
  if (summary) {
    factsList.push(`Executive Overview & Synthesis:\n${summary}`);
  }
  if (snippets.length > 0) {
    factsList.push(`Verified Web Facts & Evidence Points:\n- ${snippets.slice(0, 7).join("\n- ")}`);
  }

  return {
    topic: trimmed,
    title: resolvedTitle,
    summary,
    snippets,
    sources: sources.slice(0, 5),
    detectedCategory,
    groundedFacts: factsList.join("\n\n"),
    engineUsed,
  };
}

async function fetchTavilySearch(
  topic: string,
  apiKey: string
): Promise<{
  answer?: string;
  snippets: string[];
  sources: Array<{ title: string; url: string }>;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query: `${topic} facts overview details`,
        search_depth: "advanced",
        include_answer: true,
        include_raw_content: false,
        max_results: 7,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Tavily Search] API returned HTTP ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    const snippets: string[] = [];
    const sources: Array<{ title: string; url: string }> = [];

    if (Array.isArray(data.results)) {
      for (const item of data.results) {
        if (item.content && item.content.trim().length > 40) {
          snippets.push(unescapeHtml(item.content.trim()));
        }
        if (item.url && !sources.some((s) => s.url === item.url)) {
          sources.push({
            title: unescapeHtml(item.title || `${topic} Source`),
            url: item.url,
          });
        }
      }
    }

    return {
      answer: data.answer ? unescapeHtml(data.answer.trim()) : undefined,
      snippets,
      sources,
    };
  } catch (err: any) {
    console.warn("[Tavily Search Error]:", err?.message);
    return null;
  }
}

function unescapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

async function fetchWithTimeout(url: string, headers: HeadersInit, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
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
      const res = await fetchWithTimeout(summaryUrl, {
        "User-Agent": "OmniDashAI/1.0 (web-research-agent)",
      }, 5000);

      if (res.ok) {
        const data = await res.json();
        const isFilmOrDisambig =
          data.type === "disambiguation" ||
          (data.description && /film|soundtrack|album|movie|actor|actress/i.test(data.description) && !/film|movie/i.test(q)) ||
          (data.extract && /directed by|written and directed|stars N\. T\. Rama Rao|soundtrack/i.test(data.extract) && !/film|movie/i.test(q));

        if (!isFilmOrDisambig && data.extract && data.extract.length > 80) {
          return {
            title: unescapeHtml(data.title || q),
            extract: unescapeHtml(data.extract),
            description: unescapeHtml(data.description || ""),
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(q)}`,
          };
        }
      }

      // 2. Wikipedia Search API fallback
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        q
      )}&utf8=&format=json`;
      const searchRes = await fetchWithTimeout(searchUrl, {
        "User-Agent": "OmniDashAI/1.0 (web-research-agent)",
      }, 5000);

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const hits = searchData.query?.search || [];
        for (const hit of hits.slice(0, 3)) {
          const hitTitle = hit.title;
          // Fetch summary for top hit
          const hitSumUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            hitTitle.replace(/\s+/g, "_")
          )}`;
          try {
            const hitSumRes = await fetchWithTimeout(hitSumUrl, {
              "User-Agent": "OmniDashAI/1.0 (web-research-agent)",
            }, 5000);
            if (hitSumRes.ok) {
              const hitSumData = await hitSumRes.json();
              if (hitSumData.extract && hitSumData.extract.length > 80) {
                return {
                  title: unescapeHtml(hitSumData.title || hitTitle),
                  extract: unescapeHtml(hitSumData.extract),
                  description: unescapeHtml(hitSumData.description || ""),
                  url:
                    hitSumData.content_urls?.desktop?.page ||
                    `https://en.wikipedia.org/wiki/${encodeURIComponent(hitTitle)}`,
                };
              }
            }
          } catch {}
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
      titles.push(unescapeHtml(match[2].replace(/<[^>]+>/g, "").trim()));
    }
    while ((match = snippetRegex.exec(html)) !== null && snippets.length < 5) {
      snippets.push(unescapeHtml(match[1].replace(/<[^>]+>/g, "").trim()));
    }
    while ((match = linkRegex.exec(html)) !== null && urls.length < 5) {
      let rawUrl = match[1];
      if (rawUrl.startsWith("//")) {
        rawUrl = "https:" + rawUrl;
      }
      const uddgMatch = rawUrl.match(/uddg=([^&]+)/);
      if (uddgMatch && uddgMatch[1]) {
        try {
          rawUrl = decodeURIComponent(uddgMatch[1]);
        } catch {}
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
  if (/festival|celebration|hindu|religion|ritual|deity|god|mytholog|chaviti|chaturthi|puja|pooja/i.test(text)) {
    return "Cultural & Religious Festival";
  }
  if (/game|gaming|video game|rockstar|action-adventure|playstation|xbox|nintendo|esport/i.test(text)) {
    return "Interactive Entertainment & Gaming";
  }
  if (/vitamin|nutrient|nutrition|retinol|carotenoid|rhodopsin|dietary|mineral|micronutrient|deficiency|health/i.test(text)) {
    return "Nutrition & Biochemistry";
  }
  if (/history|revolution|empire|war|dynast|centur|civil war|republic|monarch|treaty|napoleon/i.test(text)) {
    return "History & Civilization";
  }
  if (/crop|plant|cultivat|farm|agricultur|botan|vegetable|fruit|harvest/i.test(text)) {
    return "Agriculture & Cultivation";
  }
  if (/quantum|qubit/i.test(text)) {
    return "Quantum Computing & Physics";
  }
  if (/comput|software|algorithm|hardware|artificial intelligence|\btech\b|code|programming/i.test(text)) {
    return "Technology & Computing";
  }
  if (/physic|chemistr|biolog|\bgene\b|\bgenes\b|crispr|astronom|energi|space/i.test(text)) {
    return "Science & Engineering";
  }
  if (/econom|financ|market|invest|trade|money|banking|crypto|stock/i.test(text)) {
    return "Finance & Economics";
  }
  return description || "General Knowledge";
}

function inferCategory(topic: string, summary: string, snippets: string[]): string {
  const combined = `${topic} ${summary} ${snippets.join(" ")}`.toLowerCase();
  if (/festival|chaviti|ganesh|puja|pooja|hindu|deity|visarjan|temple|ritual|celebration/i.test(combined)) {
    return "Cultural & Religious Festival";
  }
  if (/game|gaming|video game|rockstar|gta|action-adventure|playstation|xbox|nintendo|esport/i.test(combined)) {
    return "Interactive Entertainment & Gaming";
  }
  if (/vitamin|nutrient|nutrition|retinol|carotenoid|rhodopsin|dietary|mineral|micronutrient|deficiency/i.test(combined)) {
    return "Nutrition & Biochemistry";
  }
  if (/history|revolution|empire|war|dynast|centur|civil war|republic|monarch|treaty|napoleon/i.test(combined)) {
    return "History & Civilization";
  }
  if (/cultivat|harvest|crop|seed|soil|farm|fertilizer|yield/i.test(combined)) {
    return "Agriculture & Cultivation";
  }
  if (/quantum|qubit/i.test(combined)) {
    return "Quantum Computing & Physics";
  }
  if (/comput|software|code|algorithm|ai|robot|network|cloud|developer/i.test(combined)) {
    return "Technology & Computing";
  }
  if (/crispr|\bgene\b|\bgenes\b|dna|cell|disease|medic|health|patient|pharma/i.test(combined)) {
    return "Medicine & Healthcare";
  }
  if (/energy|fusion|reactor|physic|space|planet|star|astronom/i.test(combined)) {
    return "Science & Physics";
  }
  if (/stock|option|invest|market|valuation|asset|fund|capital|crypto|finance/i.test(combined)) {
    return "Finance & Economics";
  }
  return "Knowledge & Intelligence";
}
