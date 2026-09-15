# 🔮 OmniDash AI — Universal Visual Intelligence & Research Dashboard

**OmniDash AI** is a full-stack, data-driven visual intelligence platform that conducts deep research and dynamically renders interactive dashboards for **any topic**—spanning Science, Technology, Agriculture, History, Finance, Medicine, and Engineering.

Powered by Next.js 15 (App Router), TypeScript, Tailwind CSS, SQLite, and OpenRouter LLMs, it features a **zero-failure deterministic visual engine** guaranteeing rich charts, KPIs, and structured intelligence across any AI model.

---

## ✨ Features

- 🌐 **Universal Knowledge Coverage**: Research and generate structured intelligence on any subject (e.g., Quantum Computing, Tomato Cultivation, CRISPR, Roman Republic, Stock Valuation, Nuclear Fusion).
- 🛡️ **Zero-Failure Visual Engine**:
  - Multi-stage HTML parser that strips reasoning traces (`<think>...</think>`) and conversational preambles.
  - Automatic fallback to an integrated, responsive SVG template generator if an AI model outputs malformed HTML or times out.
- 📄 **Document-Grounded Research**: Upload reference PDF (`unpdf`) or Word DOCX (`mammoth`) documents to contextualize topic research with personal or domain-specific data.
- 🔒 **Enterprise-Grade API Security & Masking**:
  - API keys are stored server-side in SQLite and are never exposed in client bundles.
  - Settings UI returns masked keys (`sk-or-v1-••••••••42b1`).
  - All AI-generated dashboard HTML is strictly sanitized with `DOMPurify` to eliminate XSS risks.
- ⚙️ **In-App Dynamic Model Configuration**: Seamlessly switch between free models (e.g. `meta-llama/llama-3.3-70b-instruct:free`, `deepseek/deepseek-r1:free`) and premium models (`anthropic/claude-3.5-sonnet`) directly within the app without restarting the server.
- 🌓 **Synchronized Light & Dark Mode**: Native theme switching synchronized between the main application and nested dashboard iframe containers.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15+ (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & CSS Variables |
| **Database** | [SQLite3 (`better-sqlite3`)](https://github.com/WiseLibs/better-sqlite3) with WAL Mode |
| **AI LLM API** | [OpenRouter API](https://openrouter.ai/) (Multi-model compatibility) |
| **Document Parsing** | `unpdf` (PDF) & `mammoth` (DOCX) |
| **Sanitization** | `isomorphic-dompurify` |
| **Theme** | `next-themes` |
| **Icons** | `lucide-react` |

---

## 📁 Repository Structure

```text
OmniDash/
├── app/
│   ├── api/
│   │   ├── dashboard/generate/  # Resilient HTML dashboard generator
│   │   ├── research/            # Universal topic intelligence pipeline
│   │   ├── settings/            # Masked API key & model settings route
│   │   ├── topics/              # Discoveries index route
│   │   └── upload/              # Document parser API (PDF / DOCX)
│   ├── browse/                  # Topic directory & historical discoveries
│   ├── dashboard/[slug]/        # Rendered dashboard route
│   ├── globals.css              # Design system tokens & dark mode
│   ├── layout.tsx               # Root layout & providers
│   └── page.tsx                 # Universal search & category pills
├── components/
│   ├── DashboardFrame.tsx       # Theme-synchronized iframe container
│   ├── FileUpload.tsx           # Context document upload component
│   ├── Navbar.tsx               # Header branding, browse, & settings
│   ├── SearchBox.tsx            # Universal topic search input
│   ├── SettingsModal.tsx        # Masked API key & model settings modal
│   └── ThemeProvider.tsx        # Theme context provider
├── lib/
│   ├── dashboardTemplate.ts     # Deterministic visual dashboard engine
│   ├── db.ts                    # SQLite database connection & schema
│   └── settings.ts              # SQLite settings persistence
├── .env.example                 # Environment blueprint
├── .gitignore                   # Strict security ignore rules
├── next.config.ts               # Turbopack configuration
└── package.json                 # Project dependencies & scripts
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: `v20.16.0` or higher (Node 22 LTS recommended)
- **Package Manager**: `npm` (v10+)
- **OpenRouter API Key**: Obtain a key from [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys).

---

### 1. Installation
```bash
git clone https://github.com/YOUR_USERNAME/OmniDash.git
cd OmniDash
npm install
```

---

### 2. Environment Setup
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials in `.env.local`:
```env
OPENROUTER_API_KEY=sk-or-v1-YOUR_OPENROUTER_KEY
OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free
```

> **Note**: You can also configure your API key and model directly inside the running app via the **Settings** button in the top navigation bar.

---

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

### 4. Production Build
```bash
npm run build
npm run start
```

---

## 🔒 Security Practices

1. **API Key Isolation**: The API key is stored only in SQLite (`omnidash.db`) or `.env.local` on your local server. Client browsers only see masked representations.
2. **Git Safeguards**: `.gitignore` strictly blocks all `.env*` files, SQLite database files (`*.db`, `*.db-wal`, `*.db-shm`), and build outputs from ever being pushed to version control.
3. **HTML Sanitization**: All incoming HTML is parsed and sanitized by `DOMPurify` before database persistence.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
