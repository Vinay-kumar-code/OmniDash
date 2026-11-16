/**
 * Web Research Agent: Fetches real-time web intelligence from Tavily, Brave Search,
 * Firecrawl, Wikipedia, and DuckDuckGo.
 * Supplies ground-truth facts, statistics, historical dates, and sources for ANY topic.
 */

import {
  getTavilyApiKey,
  getBraveApiKey,
  getFirecrawlApiKey,
  getSearchProviderPreference,
} from "../settings";

export interface SearchCredentials {
  tavilyApiKey?: string;
  braveApiKey?: string;
  firecrawlApiKey?: string;
  searchProvider?: string;
}

export interface WebResearchResult {
  topic: string;
  title: string;
  summary: string;
  snippets: string[];
  sources: Array<{ title: string; url: string }>;
  detectedCategory: string;
  groundedFacts: string;
  engineUsed: "tavily" | "brave" | "firecrawl" | "wikipedia_ddg";
}

/**
 * Searches real-time web intelligence using configured search providers
 * (Tavily, Brave Search, Firecrawl) with resilient Wikipedia and DuckDuckGo fallbacks.
 */
export async function searchWebForTopic(
  topic: string,
  credentialsOrTavilyKey?: string | SearchCredentials
): Promise<WebResearchResult> {
  const trimmed = topic.trim();
  const sources: Array<{ title: string; url: string }> = [];
  const snippets: string[] = [];
  let summary = "";
  let resolvedTitle = trimmed;
  let detectedCategory = "General Knowledge";
  let engineUsed: "tavily" | "brave" | "firecrawl" | "wikipedia_ddg" = "wikipedia_ddg";

  const creds: SearchCredentials =
    typeof credentialsOrTavilyKey === "string"
      ? { tavilyApiKey: credentialsOrTavilyKey }
      : (credentialsOrTavilyKey || {});

  const tavilyKey = (creds.tavilyApiKey || getTavilyApiKey()).trim();
  const braveKey = (creds.braveApiKey || getBraveApiKey()).trim();
  const firecrawlKey = (creds.firecrawlApiKey || getFirecrawlApiKey()).trim();
  const preferredEngine = (creds.searchProvider || getSearchProviderPreference() || "auto").trim().toLowerCase();

  // Build query variants for specific terms (e.g. festivals)
  const queriesToTry: string[] = [];
  if (/chaviti|chaturthi/i.test(trimmed)) {
    queriesToTry.push("Ganesh Chaturthi", "Vinayaka Chaturthi", trimmed);
  } else {
    queriesToTry.push(trimmed);
  }

  // Pre-fetch Wikipedia encyclopedic summary concurrently
  const wikiPromise = fetchWikipediaData(queriesToTry);

  // Strategy 1: Explicit engine selection or Auto cascaded execution
  let searchEngineRan = false;

  // 1A. Brave Search (if preferred or Auto without Tavily)
  if (
    (preferredEngine === "brave" && braveKey) ||
    (preferredEngine === "auto" && !tavilyKey && braveKey)
  ) {
    console.log(`[WebResearchAgent] Querying Brave Search API for "${trimmed}"...`);
    const braveResult = await fetchBraveSearch(trimmed, braveKey);
    if (braveResult && braveResult.snippets.length > 0) {
      engineUsed = "brave";
      searchEngineRan = true;
      for (const snip of braveResult.snippets) snippets.push(snip);
      for (const src of braveResult.sources) {
        if (!sources.some((s) => s.url === src.url)) sources.push(src);
      }
    }
  }

  // 1B. Firecrawl Search (if preferred or Auto without Tavily/Brave)
  if (
    !searchEngineRan &&
    ((preferredEngine === "firecrawl" && firecrawlKey) ||
      (preferredEngine === "auto" && !tavilyKey && !braveKey && firecrawlKey))
  ) {
    console.log(`[WebResearchAgent] Querying Firecrawl API for "${trimmed}"...`);
    const firecrawlResult = await fetchFirecrawlSearch(trimmed, firecrawlKey);
    if (firecrawlResult && firecrawlResult.snippets.length > 0) {
      engineUsed = "firecrawl";
      searchEngineRan = true;
      for (const snip of firecrawlResult.snippets) snippets.push(snip);
      for (const src of firecrawlResult.sources) {
        if (!sources.some((s) => s.url === src.url)) sources.push(src);
      }
    }
  }

  // 1C. Tavily Search (if preferred or Auto default when key available)
  if (!searchEngineRan && (preferredEngine === "tavily" || preferredEngine === "auto") && tavilyKey) {
    console.log(`[WebResearchAgent] Querying Tavily AI Search for "${trimmed}"...`);
    const tavilyResult = await fetchTavilySearch(trimmed, tavilyKey);
    if (tavilyResult && (tavilyResult.snippets.length > 0 || tavilyResult.answer)) {
      engineUsed = "tavily";
      searchEngineRan = true;
      if (tavilyResult.answer) {
        summary = tavilyResult.answer;
      }
      for (const snip of tavilyResult.snippets) snippets.push(snip);
      for (const src of tavilyResult.sources) {
        if (!sources.some((s) => s.url === src.url)) sources.push(src);
      }
    }
  }

  // 1D. Cascaded fallback to any other configured keys if primary yielded nothing
  if (!searchEngineRan) {
    if (braveKey && preferredEngine !== "brave") {
      console.log(`[WebResearchAgent] Cascading to Brave Search for "${trimmed}"...`);
      const braveResult = await fetchBraveSearch(trimmed, braveKey);
      if (braveResult && braveResult.snippets.length > 0) {
        engineUsed = "brave";
        searchEngineRan = true;
        for (const snip of braveResult.snippets) snippets.push(snip);
        for (const src of braveResult.sources) {
          if (!sources.some((s) => s.url === src.url)) sources.push(src);
        }
      }
    }

    if (!searchEngineRan && firecrawlKey && preferredEngine !== "firecrawl") {
      console.log(`[WebResearchAgent] Cascading to Firecrawl Search for "${trimmed}"...`);
      const firecrawlResult = await fetchFirecrawlSearch(trimmed, firecrawlKey);
      if (firecrawlResult && firecrawlResult.snippets.length > 0) {
        engineUsed = "firecrawl";
        searchEngineRan = true;
        for (const snip of firecrawlResult.snippets) snippets.push(snip);
        for (const src of firecrawlResult.sources) {
          if (!sources.some((s) => s.url === src.url)) sources.push(src);
        }
      }
    }
  }

  // Await Wikipedia result to enrich definitions and canonical metadata
  try {
    const wiki = await wikiPromise;
    if (wiki) {
      // Only adopt Wikipedia title, summary, and category if it is genuinely a close match or synonym
      const cleanWiki = (wiki.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanTopic = trimmed.toLowerCase().replace(/[^a-z0-9]/g, "");
      const isWikiMatch = cleanWiki.includes(cleanTopic) || cleanTopic.includes(cleanWiki);
      if (isWikiMatch) {
        resolvedTitle = wiki.title;
        if (!summary) {
          summary = wiki.extract || "";
        }
        if (wiki.url && !sources.some((s) => s.url === wiki.url)) {
          sources.push({ title: `${wiki.title || resolvedTitle} (Wikipedia)`, url: wiki.url });
        }
        if (wiki.description) {
          detectedCategory = categorizeFromDescription(wiki.description, summary);
        }
      }
    }
  } catch (err) {
    console.warn("[WebResearchAgent] Wikipedia lookup warning:", err);
  }

  // 2. Final Fallback: Wikipedia + DuckDuckGo if no external engine provided snippets
  if (snippets.length === 0) {
    console.log(`[WebResearchAgent] Falling back to DuckDuckGo search for "${trimmed}"...`);
    engineUsed = "wikipedia_ddg";
    try {
      const ddgResult = await fetchDuckDuckGoSnippets(trimmed);
      for (const item of ddgResult) {
        if (item.snippet) snippets.push(item.snippet);
        if (item.url && !sources.some((s) => s.url === item.url)) {
          sources.push({ title: item.title || `${trimmed} Resource`, url: item.url });
        }
      }
    } catch (err) {
      console.warn("[WebResearchAgent] DuckDuckGo search error:", err);
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
    factsList.push(`Verified Web Facts & Evidence Points:\n- ${snippets.slice(0, 8).join("\n- ")}`);
  }

  return {
    topic: trimmed,
    title: resolvedTitle,
    summary,
    snippets,
    sources: sources.slice(0, 6),
    detectedCategory,
    groundedFacts: factsList.join("\n\n"),
    engineUsed,
  };
}

/**
 * Brave Search API: Real-time search across global web index.
 */
async function fetchBraveSearch(
  topic: string,
  apiKey: string
): Promise<{
  snippets: string[];
  sources: Array<{ title: string; url: string }>;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);

    const query = `${topic} overview details facts`;
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=7&result_filter=web`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": apiKey,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Brave Search] API returned HTTP ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    const snippets: string[] = [];
    const sources: Array<{ title: string; url: string }> = [];

    const results = data.web?.results;
    if (Array.isArray(results)) {
      for (const item of results) {
        if (item.description && item.description.trim().length > 30) {
          snippets.push(unescapeHtml(item.description.trim()));
        }
        if (Array.isArray(item.extra_snippets)) {
          for (const extra of item.extra_snippets) {
            if (typeof extra === "string" && extra.trim().length > 30) {
              snippets.push(unescapeHtml(extra.trim()));
            }
          }
        }
        if (item.url && !sources.some((s) => s.url === item.url)) {
          sources.push({
            title: unescapeHtml(item.title || `${topic} Source`),
            url: item.url,
          });
        }
      }
    }

    return { snippets, sources };
  } catch (err: any) {
    console.warn("[Brave Search Error]:", err?.message);
    return null;
  }
}

/**
 * Firecrawl API: Deep search and web scraping for factual extraction.
 */
async function fetchFirecrawlSearch(
  topic: string,
  apiKey: string
): Promise<{
  snippets: string[];
  sources: Array<{ title: string; url: string }>;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        query: `${topic} overview key facts guide`,
        limit: 5,
        scrapeOptions: {
          formats: ["markdown"],
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`[Firecrawl Search] API returned HTTP ${res.status}: ${errText.slice(0, 200)}`);
      return null;
    }

    const data = await res.json();
    const snippets: string[] = [];
    const sources: Array<{ title: string; url: string }> = [];

    const items = data.data || data.results;
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.description && item.description.trim().length > 30) {
          snippets.push(unescapeHtml(item.description.trim()));
        } else if (item.markdown && item.markdown.trim().length > 40) {
          const cleanMd = item.markdown
            .replace(/[#*`_\[\]()]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          snippets.push(cleanMd.slice(0, 280));
        }

        if (item.url && !sources.some((s) => s.url === item.url)) {
          sources.push({
            title: unescapeHtml(item.title || `${topic} Source`),
            url: item.url,
          });
        }
      }
    }

    return { snippets, sources };
  } catch (err: any) {
    console.warn("[Firecrawl Search Error]:", err?.message);
    return null;
  }
}

/**
 * Tavily AI Search: Specialized agentic deep research engine.
 */
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
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        q.replace(/\s+/g, "_")
      )}`;
      const res = await fetchWithTimeout(summaryUrl, {
        "User-Agent": "OmniDashAI/1.0 (web-research-agent)",
      }, 5000);

      if (res.ok) {
        const data = await res.json();
        if (data.type === "standard" && data.extract) {
          return {
            title: data.title,
            extract: data.extract,
            description: data.description || "",
            url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
          };
        }
      }

      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        q
      )}&format=json&origin=*`;
      const searchRes = await fetchWithTimeout(searchUrl, {
        "User-Agent": "OmniDashAI/1.0 (web-research-agent)",
      }, 4000);

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const topHit = searchData.query?.search?.[0];
        if (topHit?.title) {
          const subUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            topHit.title.replace(/\s+/g, "_")
          )}`;
          const subRes = await fetchWithTimeout(subUrl, {
            "User-Agent": "OmniDashAI/1.0 (web-research-agent)",
          }, 4000);
          if (subRes.ok) {
            const data = await subRes.json();
            return {
              title: data.title,
              extract: data.extract || "",
              description: data.description || "",
              url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
            };
          }
        }
      }
    } catch {}
  }
  return null;
}

async function fetchDuckDuckGoSnippets(query: string): Promise<Array<{ title: string; snippet: string; url: string }>> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const res = await fetchWithTimeout(url, { "User-Agent": "OmniDashAI/1.0" }, 4000);
    if (!res.ok) return [];

    const data = await res.json();
    const results: Array<{ title: string; snippet: string; url: string }> = [];

    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText,
        url: data.AbstractURL || "",
      });
    }

    if (Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 4)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.slice(0, 60),
            snippet: topic.Text,
            url: topic.FirstURL || "",
          });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}

function categorizeFromDescription(description: string, summary: string): string {
  const text = `${description} ${summary}`.toLowerCase();
  // 1. Consumer Electronics, Hardware & Mobile Devices (Checked before gaming to avoid misclassifying phones with gaming screens)
  if (/\b(smartphone|phone|mobile phone|realme|xiaomi|redmi|samsung|galaxy|iphone|pixel|oneplus|oppo|vivo|motorola|snapdragon|dimensity|mediatek|display|screen|amoled|oled|camera|mah|dart charge|fast charge|ram|storage|laptop|tablet|smartwatch|earbuds|headphones|gpu|cpu|processor|gadget)\b/i.test(text)) {
    return "Consumer Electronics & Technology";
  }
  // 2. Culture & Festival (Checked before agriculture so harvest festivals aren't misclassified)
  if (/\b(festival|celebration|observance|ritual|hindu festival|religious holiday|holiday|tradition|puja|pooja|chaviti|chaturthi|ganesh|diwali|holi|navratri|visarjan|durga puja|onam|pongal|eid|christmas)\b/i.test(text)) {
    return "Culture & Festival";
  }
  // 3. Agriculture & Cultivation
  if (/\b(crop|crops|cultivat|farm|farming|seed|seeds|soil|harvest|fertilizer|irrigation|yield|acre|pesticide|tomato|paddy|wheat|horticultur|agri\b|mandi|produce|botanical)\b/i.test(text)) {
    return "Agriculture & Cultivation";
  }
  // 4. Gaming & Interactive Entertainment (Strict game title/gameplay keywords)
  if (/\b(video game|action-adventure game|gameplay|role-playing game|rpg game|fps game|rockstar games|esport|nintendo switch|playstation exclusive|xbox series|gta\b|grand theft auto|stealth game|game studio)\b/i.test(text)) {
    return "Gaming & Entertainment";
  }
  // 5. Nutrition & Biochemistry (Only when not agricultural crops)
  if (/\b(retinol|rhodopsin|carotenoid|ascorbic|dietary allowance|rda|macronutrient|micronutrient|deficiency|hypervitaminosis|vitamin [a-z]|nutritional requirement)\b/i.test(text)) {
    return "Nutrition & Biochemistry";
  }
  // 6. Quantum Technology
  if (/quantum|qubit|superposition|quantum mechanics|decoherence|nisq/i.test(text)) {
    return "Quantum Technology";
  }
  // 7. Technology & Computing
  if (/software|programming|database|framework|computing|artificial intelligence|algorithm|cloud|api|neural network/i.test(text)) {
    return "Technology & Computing";
  }
  // 8. History & Civilization
  if (/war|battle|empire|civilization|dynasty|treaty|historical event/i.test(text)) {
    return "History & Civilization";
  }
  // 9. Business & Finance
  if (/company|corporation|financial|market|currency|stock/i.test(text)) {
    return "Business & Finance";
  }
  return "General Knowledge";
}

function inferCategory(topic: string, summary: string, snippets: string[]): string {
  const text = `${topic} ${summary} ${snippets.join(" ")}`.toLowerCase();
  // 1. Consumer Electronics, Hardware & Mobile Devices (Checked before gaming)
  if (/\b(smartphone|phone|mobile phone|realme|xiaomi|redmi|samsung|galaxy|iphone|pixel|oneplus|oppo|vivo|motorola|snapdragon|dimensity|mediatek|display|screen|amoled|oled|camera|mah|dart charge|fast charge|ram|storage|laptop|tablet|smartwatch|earbuds|headphones|gpu|cpu|processor|gadget)\b/i.test(text)) {
    return "Consumer Electronics & Technology";
  }
  // 2. Culture & Festival (Checked before agriculture)
  if (/\b(festival|pooja|puja|chaviti|chaturthi|ganesh|diwali|holi|navratri|visarjan|ritual|celebration|observance|durga puja|onam|pongal|eid|christmas)\b/i.test(text)) {
    return "Culture & Festival";
  }
  // 3. Agriculture & Cultivation
  if (/\b(crop|crops|cultivat|farm|farming|seed|seeds|soil|harvest|fertilizer|irrigation|yield|acre|pesticide|tomato|paddy|wheat|horticultur|agri\b|mandi|produce)\b/i.test(text)) {
    return "Agriculture & Cultivation";
  }
  // 4. Gaming & Interactive Entertainment (Strict game title/gameplay keywords)
  if (/\b(video game|action-adventure game|gameplay|role-playing game|rpg game|fps game|rockstar games|esport|nintendo switch|playstation exclusive|xbox series|gta\b|grand theft auto|stealth game|game studio)\b/i.test(text)) {
    return "Gaming & Entertainment";
  }
  // 5. Nutrition & Biochemistry
  if (/\b(retinol|carotenoid|rhodopsin|ascorbic|macronutrient|micronutrient|deficiency|hypervitaminosis|dietary intake|rda|vitamin [a-z]|nutritional requirement)\b/i.test(text)) {
    return "Nutrition & Biochemistry";
  }
  // 6. Quantum Technology
  if (/quantum|qubit|decoherence|superposition|nisq/i.test(text)) {
    return "Quantum Technology";
  }
  // 7. Technology & Computing
  if (/software|algorithm|cloud|api|database|neural network|machine learning|framework|developer/i.test(text)) {
    return "Technology & Computing";
  }
  // 8. History & Civilization
  if (/war|battle|revolution|republic|empire|ancient|treaty/i.test(text)) {
    return "History & Civilization";
  }
  // 9. Business & Finance
  if (/stock|market|valuation|revenue|invest|gdp|crypto/i.test(text)) {
    return "Business & Finance";
  }
  return "General Knowledge";
}
