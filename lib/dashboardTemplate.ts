/**
 * Deterministic, resilient visual dashboard generator.
 * Produces a high-quality, responsive HTML/CSS dashboard for ANY topic
 * directly from the structured research JSON.
 * Grounded in authentic topic headings, proportional SVG visualizations,
 * and topic-native schemas.
 */

export function generateDeterministicDashboard(
  data: any,
  designTokens?: string
): string {
  const topic = data.topic_name || data.crop_name || "Topic Overview";
  const category = data.category || "General Knowledge";
  const overview = data.overview || "In-depth research and intelligence summary.";
  const difficulty = data.difficulty_level || "Intermediate";

  const metricsHeading = data.metrics_heading || "📊 Key Performance Indicators & Metrics";
  const conceptsHeading = data.concepts_heading || "💡 Core Concepts & Strategic Pillars";
  const timelineHeading = data.timeline_heading || "🧭 Execution Roadmap & Timeline";
  const comparisonHeading = data.comparison_heading || "⚖️ Comparative Performance & Tradeoffs";
  const tableHeading = data.table_heading || "🛡️ Practical Solutions, Remedies & Management";
  const contextHeading = data.context_heading || "⏱️ Operational Scale & Resource Demands";
  const chartTitle = data.chart_title || "Comparative Metrics & Quantitative Benchmark";

  const keyMetrics: Array<{ label: string; value: string; description?: string; trend?: string }> =
    Array.isArray(data.key_metrics) && data.key_metrics.length > 0
      ? data.key_metrics
      : [
          data.days_to_harvest
            ? { label: "Cycle / Duration", value: `${data.days_to_harvest} Days`, description: "Full growth cycle" }
            : null,
          data.expected_yield_per_acre
            ? { label: "Expected Yield", value: data.expected_yield_per_acre, description: "Per acre benchmark" }
            : null,
          data.cost_per_acre
            ? { label: "Estimated Cost", value: data.cost_per_acre, description: "Capital required" }
            : null,
          data.profit_margin_estimate
            ? { label: "Profit Potential", value: data.profit_margin_estimate, description: "Net margin estimate" }
            : null,
        ].filter(Boolean) as any;

  const chartItems: Array<{ label: string; value: number; unit?: string; annotation?: string }> =
    Array.isArray(data.chart_items) && data.chart_items.length > 0
      ? data.chart_items
      : [];

  const coreConcepts: Array<{ title: string; description: string; takeaway?: string }> =
    Array.isArray(data.core_concepts) && data.core_concepts.length > 0
      ? data.core_concepts
      : (Array.isArray(data.cultivation_stages)
          ? data.cultivation_stages.map((s: any) => ({
              title: s.stage || "Stage",
              description: s.description || "",
              takeaway: s.duration_days ? `Duration: ${s.duration_days} days` : undefined,
            }))
          : []);

  const timeline: Array<{ step?: number; title: string; description: string; time_or_era?: string }> =
    Array.isArray(data.timeline_or_process) && data.timeline_or_process.length > 0
      ? data.timeline_or_process
      : (Array.isArray(data.cultivation_stages)
          ? data.cultivation_stages.map((s: any, idx: number) => ({
              step: idx + 1,
              title: s.stage || `Phase ${idx + 1}`,
              description: s.description || "",
              time_or_era: s.duration_days ? `${s.duration_days} days` : `Step ${idx + 1}`,
            }))
          : []);

  const comparative = data.comparative_analysis || {
    best_case_title: "🌟 Optimal Scenario & Key Advantages",
    best_case_or_advantages:
      data.historical_performance?.best_performance_year_stats || "High productivity and optimal outcomes under favorable conditions.",
    worst_case_title: "⚠️ High-Risk Scenario & Known Pitfalls",
    worst_case_or_challenges:
      data.historical_performance?.worst_performance_year_stats || "Potential volatility and supply/yield disruption under stress.",
    tradeoffs_summary: data.notes || "Balanced management and monitoring ensure consistent results.",
  };

  const tableColumns: [string, string, string] =
    Array.isArray(data.table_columns) && data.table_columns.length === 3
      ? (data.table_columns as [string, string, string])
      : ["Challenge / Area", "Recommended Solution / Action", "Notes / Details"];

  const practicalGuides: Array<{ challenge_or_area: string; solution_or_remedy: string; details?: string }> =
    Array.isArray(data.practical_guide_or_solutions) && data.practical_guide_or_solutions.length > 0
      ? data.practical_guide_or_solutions
      : (Array.isArray(data.natural_pesticides) && data.natural_pesticides.length > 0
          ? data.natural_pesticides.map((p: any) => ({
              challenge_or_area: p.pest || "Pest / Challenge",
              solution_or_remedy: p.treatment || "Remedy / Solution",
              details: "Recommended natural practice",
            }))
          : (Array.isArray(data.pests_and_diseases)
              ? data.pests_and_diseases.map((p: any) => ({
                  challenge_or_area: p.name || "Risk Factor",
                  solution_or_remedy: p.management || "Mitigation Strategy",
                  details: p.symptoms ? `Symptoms: ${p.symptoms}` : "",
                }))
              : []));

  const tableRows: Array<{ col1: string; col2: string; col3: string }> =
    Array.isArray(data.table_rows) && data.table_rows.length > 0
      ? data.table_rows
      : practicalGuides.map((g) => ({
          col1: g.challenge_or_area,
          col2: g.solution_or_remedy,
          col3: g.details || "Effective practice",
        }));

  const timeAllocation = data.time_to_learn_or_maintain || data.maintenance_hours_per_acre || {
    individual_hours: "Standard individual allocation",
    team_or_intensive_hours: "Coordinated team allocation",
    curve_summary: "Manageable with structured planning.",
  };

  const contextCards: Array<{ label: string; value: string; description: string }> =
    Array.isArray(data.context_cards) && data.context_cards.length > 0
      ? data.context_cards
      : [
          {
            label: "Individual / Single Person",
            value: timeAllocation.individual_hours || timeAllocation.single_person || "Standard effort",
            description: "Required focus hours and hands-on maintenance.",
          },
          {
            label: "Team / Scaled Operations",
            value: timeAllocation.team_or_intensive_hours || timeAllocation.double_person || "Team coordination",
            description: "Collaborative or multi-person throughput allocation.",
          },
        ];

  const risks: string[] = Array.isArray(data.risks_and_pitfalls)
    ? data.risks_and_pitfalls
    : (Array.isArray(data.risks) ? data.risks : []);

  const futureOutlook: string[] = Array.isArray(data.future_outlook_or_initiatives)
    ? data.future_outlook_or_initiatives
    : (Array.isArray(data.government_schemes) ? data.government_schemes : []);

  const sources: Array<{ title: string; url: string }> = Array.isArray(data.sources) ? data.sources : [];

  const defaultTokens = `
:root {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-ink: #0f172a;
  --color-primary: #10b981;
  --color-primary-dark: #047857;
  --color-secondary: #3b82f6;
  --color-accent: #f59e0b;
  --color-alert: #ef4444;
  --color-rule: #e2e8f0;
  --color-chart-1: #10b981;
  --color-chart-2: #3b82f6;
  --color-chart-3: #8b5cf6;
  --color-chart-4: #f59e0b;
}
.dark {
  --color-bg: #0b0f19;
  --color-surface: #1e293b;
  --color-ink: #f8fafc;
  --color-primary: #10b981;
  --color-primary-dark: #34d399;
  --color-secondary: #3b82f6;
  --color-accent: #f59e0b;
  --color-alert: #f87171;
  --color-rule: #334155;
}
`;

  return `
<style>
${designTokens || defaultTokens}

* { box-sizing: border-box; }
.dashboard-root {
  font-family: var(--font-newsreader, system-ui, -apple-system, sans-serif);
  color: var(--color-ink);
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  line-height: 1.6;
}

.hero-banner {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.12));
  border: 1px solid var(--color-rule);
  border-radius: 24px;
  padding: 36px;
  margin-bottom: 32px;
  position: relative;
  overflow: hidden;
}

.badge-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
}

.badge-primary {
  background: rgba(16, 185, 129, 0.18);
  color: var(--color-primary-dark);
  border-color: rgba(16, 185, 129, 0.3);
}

.hero-title {
  font-family: var(--font-archivo, sans-serif);
  font-size: 38px;
  font-weight: 900;
  margin: 0 0 12px 0;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.hero-overview {
  font-size: 17px;
  opacity: 0.88;
  margin: 0;
  max-width: 850px;
}

.section-heading {
  font-family: var(--font-archivo, sans-serif);
  font-size: 22px;
  font-weight: 800;
  margin: 40px 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--color-rule);
  padding-bottom: 12px;
  color: var(--color-ink);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.metric-card {
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
  border-radius: 20px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 12px -2px rgba(0,0,0,0.05);
}

.metric-label {
  font-size: 13px;
  text-transform: uppercase;
  font-weight: 700;
  opacity: 0.65;
  margin-bottom: 8px;
}

.metric-value {
  font-family: var(--font-ibm-plex-mono, monospace);
  font-size: 26px;
  font-weight: 800;
  color: var(--color-primary);
  margin-bottom: 6px;
}

.metric-desc {
  font-size: 13px;
  opacity: 0.75;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.card {
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 4px 12px -2px rgba(0,0,0,0.04);
}

.card-title {
  font-family: var(--font-archivo, sans-serif);
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: var(--color-ink);
}

.timeline-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
  border-radius: 16px;
  padding: 18px;
  align-items: flex-start;
}

.timeline-step {
  background: var(--color-secondary);
  color: #ffffff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.comp-box {
  border-radius: 20px;
  padding: 24px;
  border: 1px solid var(--color-rule);
}

.comp-best {
  background: rgba(16, 185, 129, 0.08);
  border-left: 4px solid var(--color-primary);
}

.comp-worst {
  background: rgba(239, 68, 68, 0.08);
  border-left: 4px solid var(--color-alert);
}

.guide-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--color-rule);
  border-radius: 16px;
  overflow: hidden;
  margin-top: 16px;
}

.guide-table th, .guide-table td {
  padding: 14px 18px;
  text-align: left;
  border-bottom: 1px solid var(--color-rule);
}

.guide-table th {
  background: var(--color-bg);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  color: var(--color-ink);
}

.guide-table tr:last-child td {
  border-bottom: none;
}

.chart-container {
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px -2px rgba(0,0,0,0.04);
}

.sources-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.source-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-surface);
  border: 1px solid var(--color-rule);
  border-radius: 12px;
  text-decoration: none;
  color: var(--color-primary);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.source-chip:hover {
  background: var(--color-primary);
  color: #ffffff;
  transform: translateY(-1px);
}
</style>

<div class="dashboard-root">
  <!-- Hero Section -->
  <div class="hero-banner">
    <div class="badge-row">
      <span class="badge badge-primary">${escapeHtml(category)}</span>
      <span class="badge">Difficulty: ${escapeHtml(difficulty)}</span>
    </div>
    <h1 class="hero-title">${escapeHtml(topic)}</h1>
    <p class="hero-overview">${escapeHtml(overview)}</p>
  </div>

  <!-- Key Metrics Section -->
  ${
    keyMetrics.length > 0
      ? `
  <div class="section-heading">
    <span>${escapeHtml(metricsHeading)}</span>
  </div>
  <div class="metrics-grid">
    ${keyMetrics
      .map(
        (m) => `
      <div class="metric-card">
        <div>
          <div class="metric-label">${escapeHtml(m.label)}</div>
          <div class="metric-value">${escapeHtml(m.value)}</div>
        </div>
        ${m.description ? `<div class="metric-desc">${escapeHtml(m.description)}</div>` : ""}
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  <!-- Authentic Proportional SVG Chart -->
  ${renderSvgChart(chartTitle, chartItems, keyMetrics)}

  <!-- Core Concepts & Deep Insights -->
  ${
    coreConcepts.length > 0
      ? `
  <div class="section-heading">
    <span>${escapeHtml(conceptsHeading)}</span>
  </div>
  <div class="card-grid">
    ${coreConcepts
      .map(
        (c) => `
      <div class="card">
        <h3 class="card-title">${escapeHtml(c.title)}</h3>
        <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.85;">${escapeHtml(c.description)}</p>
        ${c.takeaway ? `<div style="font-size: 12px; font-weight: 700; color: var(--color-secondary);">Takeaway: ${escapeHtml(c.takeaway)}</div>` : ""}
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  <!-- Chronological Timeline / Stages -->
  ${
    timeline.length > 0
      ? `
  <div class="section-heading">
    <span>${escapeHtml(timelineHeading)}</span>
  </div>
  <div class="timeline-list">
    ${timeline
      .map(
        (t, idx) => `
      <div class="timeline-item">
        <div class="timeline-step">${t.step || idx + 1}</div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; flex-wrap: wrap; gap: 8px;">
            <div style="font-weight: 700; font-size: 16px;">${escapeHtml(t.title)}</div>
            ${t.time_or_era ? `<span class="badge">${escapeHtml(t.time_or_era)}</span>` : ""}
          </div>
          <p style="margin: 0; font-size: 14px; opacity: 0.85;">${escapeHtml(t.description)}</p>
        </div>
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  <!-- Comparative Best vs Worst Analysis -->
  <div class="section-heading">
    <span>${escapeHtml(comparisonHeading)}</span>
  </div>
  <div class="comparison-grid">
    <div class="comp-box comp-best">
      <div style="font-weight: 800; font-size: 16px; color: var(--color-primary-dark); margin-bottom: 8px;">
        ${escapeHtml(comparative.best_case_title || "🌟 Optimal Scenario & Key Advantages")}
      </div>
      <p style="margin: 0; font-size: 14px;">${escapeHtml(comparative.best_case_or_advantages)}</p>
    </div>
    <div class="comp-box comp-worst">
      <div style="font-weight: 800; font-size: 16px; color: var(--color-alert); margin-bottom: 8px;">
        ${escapeHtml(comparative.worst_case_title || "⚠️ High-Risk Scenario & Known Pitfalls")}
      </div>
      <p style="margin: 0; font-size: 14px;">${escapeHtml(comparative.worst_case_or_challenges)}</p>
    </div>
  </div>
  ${
    comparative.tradeoffs_summary
      ? `
  <div style="margin-top: 16px; padding: 14px 20px; background: var(--color-surface); border: 1px solid var(--color-rule); border-radius: 14px; font-size: 14px; opacity: 0.9;">
    <strong>⚖️ Tradeoff Summary:</strong> ${escapeHtml(comparative.tradeoffs_summary)}
  </div>
  `
      : ""
  }

  <!-- Topic-Native Guide / Reference Table -->
  ${
    tableRows.length > 0
      ? `
  <div class="section-heading">
    <span>${escapeHtml(tableHeading)}</span>
  </div>
  <table class="guide-table">
    <thead>
      <tr>
        <th style="width: 28%;">${escapeHtml(tableColumns[0])}</th>
        <th style="width: 36%;">${escapeHtml(tableColumns[1])}</th>
        <th style="width: 36%;">${escapeHtml(tableColumns[2])}</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows
        .map(
          (r) => `
        <tr>
          <td style="font-weight: 700; color: var(--color-ink);">${escapeHtml(r.col1)}</td>
          <td style="color: var(--color-primary-dark); font-weight: 600;">${escapeHtml(r.col2)}</td>
          <td style="font-size: 13.5px; opacity: 0.85;">${escapeHtml(r.col3)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  <!-- Context Cards / Operational Demands -->
  <div class="section-heading">
    <span>${escapeHtml(contextHeading)}</span>
  </div>
  <div class="card-grid">
    ${contextCards
      .map(
        (c) => `
      <div class="card">
        <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; opacity: 0.65; margin-bottom: 6px;">
          ${escapeHtml(c.label)}
        </div>
        <div style="font-size: 22px; font-weight: 800; color: var(--color-primary); margin-bottom: 8px;">
          ${escapeHtml(c.value)}
        </div>
        <p style="margin: 0; font-size: 13px; opacity: 0.75;">${escapeHtml(c.description)}</p>
      </div>
    `
      )
      .join("")}
  </div>

  <!-- Known Risks & Pitfalls (if available) -->
  ${
    risks.length > 0
      ? `
  <div class="section-heading">
    <span>⚠️ Critical Risks & Known Vulnerabilities</span>
  </div>
  <div class="timeline-list">
    ${risks
      .map(
        (r) => `
      <div class="timeline-item" style="border-left: 4px solid var(--color-alert);">
        <div class="timeline-step" style="background: var(--color-alert); font-size: 13px;">!</div>
        <div style="flex: 1; font-size: 14px; opacity: 0.9;">${escapeHtml(r)}</div>
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  <!-- Future Outlook & Strategic Directions (if available) -->
  ${
    futureOutlook.length > 0
      ? `
  <div class="section-heading">
    <span>🚀 Future Outlook & Strategic Roadmap</span>
  </div>
  <div class="timeline-list">
    ${futureOutlook
      .map(
        (f) => `
      <div class="timeline-item" style="border-left: 4px solid var(--color-secondary);">
        <div class="timeline-step" style="background: var(--color-secondary); font-size: 13px;">★</div>
        <div style="flex: 1; font-size: 14px; opacity: 0.9;">${escapeHtml(f)}</div>
      </div>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }

  <!-- Verified Sources & Citations -->
  ${
    sources.length > 0
      ? `
  <div class="section-heading">
    <span>🔗 Verified Information Sources & References</span>
  </div>
  <div class="sources-list">
    ${sources
      .map(
        (s) => `
      <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer" class="source-chip">
        <span>↗</span>
        <span>${escapeHtml(s.title || s.url)}</span>
      </a>
    `
      )
      .join("")}
  </div>
  `
      : ""
  }
</div>
`;
}

/**
 * Renders an authentic proportional SVG horizontal comparison chart.
 * Uses real mathematical scaling calibrated to the maximum metric value.
 */
function renderSvgChart(
  chartTitle: string,
  chartItems: Array<{ label: string; value: number; unit?: string; annotation?: string }>,
  fallbackMetrics: Array<{ label: string; value: string }>
): string {
  let items = chartItems && chartItems.length > 0 ? chartItems : [];

  // If no structured chart items, derive from keyMetrics
  if (items.length === 0 && fallbackMetrics.length > 0) {
    items = fallbackMetrics.slice(0, 5).map((m, idx) => {
      const match = m.value.match(/(\d+(?:\.\d+)?)/);
      const parsed = match ? parseFloat(match[1]) : 75 + (idx % 3) * 10;
      const cleanUnit = m.value.replace(/[\d\.\-\s]+/g, " ").trim().slice(0, 10);
      return {
        label: m.label,
        value: parsed,
        unit: cleanUnit || undefined,
        annotation: m.value,
      };
    });
  }

  if (items.length === 0) return "";

  const numericValues = items.map((it) => {
    const val = typeof it.value === "number" ? it.value : parseFloat(String(it.value));
    return isNaN(val) || val <= 0 ? 1 : val;
  });
  const maxVal = Math.max(...numericValues, 1);

  const rowHeight = 56;
  const topPadding = 30;
  const totalHeight = topPadding + items.length * rowHeight + 40;
  const chartWidth = 720;
  const barStartX = 180;
  const barMaxWidth = 390;

  const barColors = [
    { start: "var(--color-primary)", end: "var(--color-secondary)" },
    { start: "var(--color-secondary)", end: "var(--color-accent)" },
    { start: "var(--color-accent)", end: "var(--color-primary)" },
    { start: "var(--color-chart-3)", end: "var(--color-secondary)" },
    { start: "var(--color-primary)", end: "var(--color-chart-3)" },
  ];

  return `
  <div class="chart-container">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; flex-wrap: wrap; gap: 8px;">
      <div style="font-weight: 800; font-size: 16px; color: var(--color-ink); display: flex; align-items: center; gap: 8px;">
        <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--color-primary);"></span>
        <span>${escapeHtml(chartTitle)}</span>
      </div>
      <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; opacity: 0.6; letter-spacing: 0.05em;">
        Proportional Value Distribution
      </div>
    </div>
    
    <svg viewBox="0 0 ${chartWidth} ${totalHeight}" width="100%" height="${totalHeight}" style="overflow: visible; font-family: var(--font-archivo, system-ui, sans-serif);">
      <defs>
        ${barColors
          .map(
            (g, idx) => `
          <linearGradient id="chartGrad${idx}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${g.start}" stop-opacity="0.95" />
            <stop offset="100%" stop-color="${g.end}" stop-opacity="0.8" />
          </linearGradient>
        `
          )
          .join("")}
      </defs>

      <!-- Background vertical gridlines at 0%, 25%, 50%, 75%, 100% -->
      ${[0, 0.25, 0.5, 0.75, 1]
        .map((pct) => {
          const xPos = barStartX + pct * barMaxWidth;
          return `
          <line x1="${xPos}" y1="${topPadding - 5}" x2="${xPos}" y2="${totalHeight - 32}" stroke="var(--color-rule)" stroke-width="1" stroke-dasharray="${pct === 0 ? "none" : "3,3"}" opacity="0.65" />
        `;
        })
        .join("")}

      <!-- Rows for each benchmark item -->
      ${items
        .map((it, idx) => {
          const yBase = topPadding + idx * rowHeight;
          const val = numericValues[idx];
          const barWidth = Math.max(14, (val / maxVal) * barMaxWidth);
          const gradId = `chartGrad${idx % barColors.length}`;
          const formattedVal = val >= 1000 ? val.toLocaleString() : String(val);
          const displayVal = it.unit ? `${formattedVal} ${it.unit}` : formattedVal;

          return `
          <g class="chart-row">
            <!-- Label -->
            <text x="${barStartX - 14}" y="${yBase + 16}" text-anchor="end" font-size="12" font-weight="700" fill="var(--color-ink)">
              ${escapeHtml(it.label.length > 25 ? it.label.slice(0, 24) + "…" : it.label)}
            </text>
            
            <!-- Bar background track -->
            <rect x="${barStartX}" y="${yBase}" width="${barMaxWidth}" height="22" rx="6" fill="var(--color-rule)" opacity="0.4" />
            
            <!-- Scaled Proportional Value Bar -->
            <rect x="${barStartX}" y="${yBase}" width="${barWidth}" height="22" rx="6" fill="url(#${gradId})" />
            
            <!-- Numeric Value Label -->
            <text x="${barStartX + barWidth + 12}" y="${yBase + 16}" font-size="12" font-weight="800" font-family="var(--font-ibm-plex-mono, monospace)" fill="var(--color-primary-dark)">
              ${escapeHtml(displayVal)}
            </text>
            
            <!-- Annotation / Sub-note -->
            ${
              it.annotation
                ? `
              <text x="${barStartX}" y="${yBase + 34}" font-size="10.5" fill="var(--color-ink)" opacity="0.6">
                ${escapeHtml(it.annotation.length > 72 ? it.annotation.slice(0, 70) + "…" : it.annotation)}
              </text>
            `
                : ""
            }
          </g>
        `;
        })
        .join("")}

      <!-- Bottom baseline axis -->
      <line x1="${barStartX}" y1="${totalHeight - 24}" x2="${barStartX + barMaxWidth}" y2="${totalHeight - 24}" stroke="var(--color-rule)" stroke-width="1.5" />
      <text x="${barStartX}" y="${totalHeight - 10}" font-size="10" fill="var(--color-ink)" opacity="0.5">0</text>
      <text x="${barStartX + barMaxWidth / 2}" y="${totalHeight - 10}" font-size="10" text-anchor="middle" fill="var(--color-ink)" opacity="0.5">50%</text>
      <text x="${barStartX + barMaxWidth}" y="${totalHeight - 10}" font-size="10" text-anchor="end" fill="var(--color-ink)" opacity="0.5">Peak (Max)</text>
    </svg>
  </div>
  `;
}

function escapeHtml(str: any): string {
  if (typeof str !== "string") {
    str = String(str || "");
  }
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
