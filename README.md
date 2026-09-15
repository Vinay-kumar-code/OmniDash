# 🔮 OmniDash AI — Universal Visual Intelligence & Knowledge Dashboard

**OmniDash AI** is a full-stack, data-driven visual intelligence platform that instantly researches and generates rich, interactive dashboards for **any topic**—spanning Science, Technology, Agriculture, History, Finance, Medicine, and Engineering.

Built with Next.js 15 (App Router), TypeScript, Tailwind CSS, SQLite, and OpenRouter LLMs, it features a **zero-failure deterministic visual engine** that guarantees beautifully styled charts and KPIs across any AI model.

---

## ✨ Key Features

- 🌐 **Universal Knowledge Coverage**: Research and generate structured intelligence on any subject (e.g., Quantum Computing, Tomato Cultivation, CRISPR, Roman Republic, Stock Valuation, Nuclear Fusion).
- 🛡️ **Zero-Failure Dashboard Engine**:
  - Implements multi-stage HTML validation, stripping reasoning tags (`<think>...</think>`) and conversational preambles.
  - Automatically falls back to an integrated, responsive SVG template generator if an AI model outputs malformed HTML or times out. **No more HTML error screens!**
- 📄 **Multiformat Document Grounding**: Upload reference PDF (`unpdf`) or DOCX (`mammoth`) documents to ground research in personal or proprietary context.
- 🔒 **Enterprise-Grade API Security & Masking**:
  - OpenRouter API keys are stored server-side in SQLite and never transmitted to the client.
  - Settings UI returns masked keys (`sk-or-v1-••••••••42b1`). Updating requires explicitly providing a new key.
  - AI-generated dashboard HTML is sanitized using `DOMPurify` to eliminate XSS risks.
- ⚙️ **In-App Dynamic Settings**: Select free models (e.g. `meta-llama/llama-3.3-70b-instruct:free`, `deepseek/deepseek-r1:free`) or premium models (`anthropic/claude-3.5-sonnet`) directly in the app without editing code or restarting the server.
- 🌓 **Synchronized Light & Dark Mode**: Persistent theme switching synchronized across both the host app and nested dashboard iframe containers.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 15+ (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) & Custom CSS Variables |
| **Database** | [SQLite3 (`better-sqlite3`)](https://github.com/WiseLibs/better-sqlite3) with WAL Mode |
| **AI LLM API** | [OpenRouter API](https://openrouter.ai/) (Compatible with all models) |
| **Document Parsing** | `unpdf` (PDFs) & `mammoth` (Word DOCX) |
| **Sanitization** | `isomorphic-dompurify` |
| **Theme** | `next-themes` |
| **Icons** | `lucide-react` |

---

## 📁 Project Structure

```text
OmniDash/
├── app/
│   ├── api/
│   │   ├── dashboard/generate/  # Resilient HTML generator route
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
│   ├── db.ts                    # SQLite database & auto-migration
│   └── settings.ts              # SQLite settings persistence
├── .env.example                 # Environment blueprint
├── .gitignore                   # Strict security ignore rules
├── next.config.ts               # Turbopack pinned root configuration
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

Configure `.env.local`:
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

## 🌿 How to Branch the Previous AgriDash & Push OmniDash to GitHub

If you want to preserve the earlier AgriDash work on a dedicated branch and push this new OmniDash version to `main` (or a brand-new repository), follow these steps:

### Option A: Save Previous Work as a Branch in the Same Repo
```bash
# 1. Check current status
git status

# 2. If you want to create an archive branch of the past commit:
git branch legacy-agridash

# 3. Add all current OmniDash files to the main branch
git add .

# 4. Commit OmniDash
git commit -m "feat: complete rebranding to OmniDash AI with universal knowledge engine and zero-failure dashboard generator"

# 5. Push both branches to GitHub
git push origin legacy-agridash
git push origin main
```

### Option B: Push OmniDash to a Fresh New GitHub Repository
```bash
# 1. Create a new empty repository on GitHub named 'OmniDash'

# 2. Stage and commit all files locally
git add .
git commit -m "Initial commit: OmniDash AI Universal Intelligence Platform"

# 3. Rename current branch to main
git branch -M main

# 4. Set the new remote URL (replace with your new repo URL)
git remote set-url origin https://github.com/YOUR_USERNAME/OmniDash.git

# 5. Push to your new repository
git push -u origin main
```

---

## 🔒 Security Practices

1. **API Key Isolation**: The API key is stored only in SQLite (`omnidash.db`) or `.env.local` on your local server. Client browsers only see masked representations.
2. **Git Safeguards**: `.gitignore` strictly blocks all `.env*` files, SQLite database files (`*.db`, `*.db-wal`, `*.db-shm`), and build outputs from ever being pushed to version control.
3. **HTML Sanitization**: All incoming HTML is parsed and sanitized by `DOMPurify` before database persistence.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
