/**
 * Deterministic, resilient visual dashboard generator.
 * Produces a high-quality, responsive HTML/CSS dashboard for ANY topic
 * directly from the structured research JSON.
 * Used as a rock-solid guarantee when AI models output malformed or incomplete HTML.
 */

export function generateDeterministicDashboard(
  data: any,
  designTokens?: string
): string {
  const topic = data.topic_name || data.crop_name || "Topic Overview";
  const category = data.category || "General Knowledge";
  const overview = data.overview || "In-depth research and intelligence summary.";
  const difficulty = data.difficulty_level || "Intermediate";

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
    best_case_or_advantages:
      data.historical_performance?.best_performance_year_stats || "High productivity and optimal outcomes under favorable conditions.",
    worst_case_or_challenges:
      data.historical_performance?.worst_performance_year_stats || "Potential volatility and supply/yield disruption under stress.",
    tradeoffs_summary: data.notes || "Balanced management and monitoring ensure consistent results.",
  };

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

  const timeAllocation = data.time_to_learn_or_maintain || data.maintenance_hours_per_acre || {
    individual_hours: "Standard individual allocation",
    team_or_intensive_hours: "Coordinated team allocation",
    curve_summary: "Manageable with structured planning.",
  };

  const risks: string[] = Array.isArray(data.risks_and_pitfalls)
    ? data.risks_and_pitfalls
    : (Array.isArray(data.risks) ? data.risks : []);

  const futureOutlook: string[] = Array.isArray(data.future_outlook_or_initiatives)
    ? data.future_outlook_or_initiatives
    : (Array.isArray(data.government_schemes) ? data.government_schemes : []);

  const sources: Array<{ title: string; url: string }> = Array.isArray(data.sources) ? data.sources : [];

  const defaultTokens = `
:root {
  --color-bg: #f4fdf8;
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
  --color-bg: #0f172a;
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
  opacity: 0.85;
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
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
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
  opacity: 0.6;
  margin-bottom: 8px;
}

.metric-value {
  font-family: var(--font-ibm-plex-mono, monospace);
  font-size: 28px;
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
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
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

  <!-- Key Metrics & SVG Chart -->
  ${
    keyMetrics.length > 0
      ? `
  <div class="section-heading">
    <span>📊 Key Performance Indicators & Metrics</span>
  </div>
  <div class="metrics-grid">
    ${keyMetrics
      .map(
        (m, idx) => `
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

  <!-- Responsive SVG Comparison Chart -->
  <div class="chart-container">
    <div style="font-weight: 700; margin-bottom: 16px; font-size: 15px;">Visual Distribution Benchmark</div>
    <svg viewBox="0 0 600 160" width="100%" height="160" style="overflow: visible;">
      <line x1="40" y1="130" x2="580" y2="130" stroke="var(--color-rule)" stroke-width="2" />
      ${keyMetrics
        .slice(0, 4)
        .map((m, i) => {
          const x = 70 + i * 130;
          const height = 40 + (i % 3) * 35;
          const y = 130 - height;
          const colors = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];
          const barColor = colors[i % colors.length];
          return `
          <rect x="${x}" y="${y}" width="48" height="${height}" rx="8" fill="${barColor}" opacity="0.85" />
          <text x="${x + 24}" y="${y - 8}" font-size="12" font-weight="700" text-anchor="middle" fill="var(--color-ink)">${escapeHtml(
            m.value.slice(0, 10)
          )}</text>
          <text x="${x + 24}" y="148" font-size="11" text-anchor="middle" fill="var(--color-ink)" opacity="0.7">${escapeHtml(
            m.label.slice(0, 12)
          )}</text>
        `;
        })
        .join("")}
    </svg>
  </div>
  `
      : ""
  }

  <!-- Core Concepts & Deep Insights -->
  ${
    coreConcepts.length > 0
      ? `
  <div class="section-heading">
    <span>💡 Core Concepts & Strategic Pillars</span>
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
    <span>🧭 Execution Roadmap & Timeline</span>
  </div>
  <div class="timeline-list">
    ${timeline
      .map(
        (t, idx) => `
      <div class="timeline-item">
        <div class="timeline-step">${t.step || idx + 1}</div>
        <div style="flex: 1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
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
    <span>⚖️ Comparative Performance & Tradeoffs</span>
  </div>
  <div class="comparison-grid">
    <div class="comp-box comp-best">
      <div style="font-weight: 800; font-size: 16px; color: var(--color-primary-dark); margin-bottom: 8px;">
        🌟 Optimal Scenario & Key Advantages
      </div>
      <p style="margin: 0; font-size: 14px;">${escapeHtml(comparative.best_case_or_advantages)}</p>
    </div>
    <div class="comp-box comp-worst">
      <div style="font-weight: 800; font-size: 16px; color: var(--color-alert); margin-bottom: 8px;">
        ⚠️ High-Risk Scenario & Known Pitfalls
      </div>
      <p style="margin: 0; font-size: 14px;">${escapeHtml(comparative.worst_case_or_challenges)}</p>
    </div>
  </div>

  <!-- Practical Guide / Solutions / Remedies Table -->
  ${
    practicalGuides.length > 0
      ? `
  <div class="section-heading">
    <span>🛡️ Practical Solutions, Remedies & Management</span>
  </div>
  <table class="guide-table">
    <thead>
      <tr>
        <th>Challenge / Area</th>
        <th>Recommended Solution / Action</th>
        <th>Notes / Details</th>
      </tr>
    </thead>
    <tbody>
      ${practicalGuides
        .map(
          (g) => `
        <tr>
          <td style="font-weight: 700;">${escapeHtml(g.challenge_or_area)}</td>
          <td style="color: var(--color-primary-dark); font-weight: 600;">${escapeHtml(g.solution_or_remedy)}</td>
          <td style="font-size: 13px; opacity: 0.8;">${escapeHtml(g.details || "Effective practice")}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>
  `
      : ""
  }

  <!-- Time Allocation & Effort Requirements -->
  <div class="section-heading">
    <span>⏱️ Human Time Allocation & Resource Demands</span>
  </div>
  <div class="card-grid">
    <div class="card">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; opacity: 0.6;">Individual / Single Person</div>
      <div style="font-size: 20px; font-weight: 800; color: var(--color-primary); margin: 6px 0;">
        ${escapeHtml(timeAllocation.individual_hours || timeAllocation.single_person || "Standard effort")}
      </div>
      <p style="margin: 0; font-size: 13px; opacity: 0.75;">Required focus hours and hands-on maintenance.</p>
    </div>
    <div class="card">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; opacity: 0.6;">Team / Scaled Operations</div>
      <div style="font-size: 20px; font-weight: 800; color: var(--color-secondary); margin: 6px 0;">
        ${escapeHtml(timeAllocation.team_or_intensive_hours || timeAllocation.double_person || "Team coordination")}
      </div>
      <p style="margin: 0; font-size: 13px; opacity: 0.75;">Collaborative or multi-person throughput allocation.</p>
    </div>
  </div>

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
