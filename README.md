# Recap 🧠⚡

> **Active Recall & Synthesis Engine for Product Leaders, Analysts, and Builders**  
> Transform passive video consumption into durable mental models through thesis extraction, forced synthesis, and spaced resurfacing.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38B2AC.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-000000.svg)](https://expressjs.com/)
[![Google Gemini API](https://img.shields.io/badge/Gemini_API-@google/genai-4285F4.svg)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📖 Overview

Product managers, strategists, and analysts consume dozens of hours of video masterclasses, tech talks, and conference keynotes every month. Yet research on the **Ebbinghaus Forgetting Curve** shows that **over 75% of un-recalled information is lost within 48 hours**. Traditional bookmarks and passive notes sit unread in digital graveyards.

**Recap** bridges the gap between passive listening and permanent intuition. Instead of generic AI bullet points, Recap extracts **falsifiable, high-conviction claims**, challenges you with **provocative cognitive action prompts**, and schedules **spaced recall drills** so critical product insights become second nature.

---

## ✨ Key Features

### 1. 🎥 Automated YouTube Ingestion Pipeline
- **Instant Video Extraction:** Paste any standard YouTube URL (`youtube.com/watch?v=...`, `youtu.be/...`, or YouTube Shorts).
- **Automated Metadata & Transcripts:** Fetches video title, speaker channel, duration, and captions with second-accurate timestamps via server-side extractors.
- **Executive Summaries & Takeaways:** Automatically generates a dense executive summary along with 4 high-impact operational takeaways.
- **Interactive Video Theater:** Embedded player synchronized with timestamps—clicking any timestamp chip jumps the video directly to that moment.
- **Curated PM Masterclasses:** Built-in curated talks from industry leaders (Shreyas Doshi, Elena Verna, Marty Cagan) ready to explore with zero setup.

### 2. 🎯 High-Signal Claim Extraction
- Moves beyond superficial video summaries to identify **3 to 5 testable, provocative core claims**.
- Each claim is tagged with its source timestamp and a strategic domain (e.g., *Product Strategy*, *Growth & PLG*, *Discovery Trade-offs*, *Execution & Risk*).
- Full claim lifecycle: add custom claims, edit statements, or delete irrelevant points.

### 3. 🧠 Cognitive Action Workflows (Forced Synthesis)
Rather than summarizing what the speaker said, Recap prompts you to challenge and apply the idea:
- **Contrarian Teardown:** Identifies scenarios where the speaker's claim completely fails, revealing hidden boundary conditions and edge cases.
- **Real-World Application:** Maps the thesis directly into your current sprint, product roadmap, or team friction point.
- **First-Principles Audit:** Strips away jargon to evaluate the foundational assumptions underlying the speaker's argument.

### 4. 📊 AI Rubric Evaluation & Cognitive Scoring
- Evaluates your written response using a rigorous 3-part cognitive rubric:
  - **Synthesis Depth:** Depth of original thought versus verbatim repetition.
  - **Logical Rigor:** Strength of counter-arguments and falsifiability.
  - **Actionability:** Pragmatic applicability to real product decisions.
- Highlights your **Blindspot Challenge**—a strategic counter-question designed to deepen your mental model.

### 5. 🔁 Spaced Recall Engine & Resurfacing Vault
- **Algorithmic Review Intervals:** Schedules reviews at 1 day, 3 days, 7 days, 14 days, and 30 days after synthesis.
- **Interactive Recall Drills:** Generate active-recall quiz scenarios where you re-evaluate your original thesis under new constraints.
- **Retention Health Metrics:** Real-time visibility into revisit percentage, streak tracking, and "at-risk" items that haven't been reviewed.
- **Export & Search:** Full-text search, topic filtering, and one-click JSON/Markdown clipboard exports for your personal knowledge base.

### 6. 🎨 High-Craft UI & Theme System
- Designed with high-contrast, accessible typography (Plus Jakarta Sans, Newsreader, JetBrains Mono).
- Seamless **Light and Dark mode** toggle adhering strictly to WCAG AA contrast standards.
- Fully responsive across desktop, tablet, and mobile displays.

---

## 🏗️ Architecture & Tech Stack

```
                     ┌─────────────────────────────────────────┐
                     │            Client (React 19)            │
                     │  Vite • Tailwind CSS v4 • Motion/React  │
                     └────────────────────┬────────────────────┘
                                          │  REST API
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │          Server (Express 4)             │
                     │     Node.js • TypeScript via tsx        │
                     └──────┬───────────────────────────┬──────┘
                            │                           │
                            ▼                           ▼
        ┌───────────────────────────────┐   ┌───────────────────────────┐
        │       Google Gemini API       │   │ YouTube Captions & oEmbed │
        │    (@google/genai SDK)        │   │ (youtube-transcript + API)│
        └───────────────────────────────┘   └───────────────────────────┘
```

- **Frontend:**
  - **Framework:** React 19 with TypeScript
  - **Bundler:** Vite 6
  - **Styling:** Tailwind CSS v4
  - **Motion & Transitions:** `motion/react`
  - **Icons:** `lucide-react`
- **Backend:**
  - **Runtime:** Node.js (v18+ or v20+)
  - **Server Framework:** Express 4
  - **Execution & Bundling:** `tsx` (dev mode) and `esbuild` (production CJS bundle)
- **AI & Integrations:**
  - **Google Gen AI SDK:** `@google/genai` powered by Gemini models (with lazy initialization and robust offline heuristic fallbacks)
  - **YouTube Extraction:** `youtube-transcript` and fallback oEmbed/noembed services

---

## 📁 Project Structure

```
├── .env.example               # Template for environment variables
├── index.html                 # HTML entry point with typography & meta tags
├── metadata.json              # AI Studio application metadata and capabilities
├── package.json               # Dependencies and build scripts
├── server.ts                  # Express backend, Gemini API proxy & YouTube scraper
├── src/
│   ├── App.tsx                # Main application component and view orchestrator
│   ├── main.tsx               # Client entry point
│   ├── index.css              # Tailwind CSS imports and global tokens
│   ├── types.ts               # Shared TypeScript data models and interfaces
│   ├── components/
│   │   ├── Navigation.tsx     # Header bar, view switcher, and theme toggle
│   │   ├── DashboardView.tsx  # Retention analytics, daily streak, and due reviews
│   │   ├── NewSessionView.tsx # YouTube URL ingest, video player, and claim dock
│   │   ├── CognitiveActionView.tsx # Thesis challenge & prompt writing interface
│   │   ├── FeedbackView.tsx   # Rubric scoring, blindspot evaluation, and saving
│   │   ├── LibraryView.tsx    # Searchable knowledge vault and export tools
│   │   ├── ResurfaceModal.tsx # Spaced recall drill quiz modal
│   │   ├── CreateItemModal.tsx# Manual synthesis creation dialog
│   │   └── EditItemModal.tsx  # Edit saved claim and synthesis entries
│   ├── context/
│   │   └── ThemeContext.tsx   # Light/Dark mode state and persistence
│   └── data/
│       └── sampleTranscripts.ts # Curated PM talks (Doshi, Verna, Cagan)
└── vite.config.ts             # Vite configuration with Tailwind CSS plugin
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18.0.0 or higher (v20 LTS recommended)
- **npm**: Version 9.0.0 or higher (or `pnpm` / `yarn`)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/recap.git
cd recap
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to provide your Google Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key-here"
```
> **Note:** If `GEMINI_API_KEY` is not provided, Recap will automatically operate in **offline heuristic mode**, utilizing built-in semantic parsers so you can test all workflows without an API key.

### 4. Start Development Server
```bash
npm run dev
```
The application will launch at **`http://localhost:3000`**.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🧭 How to Use Recap: User Guide

### Step 1: Ingest a Video
1. Navigate to the **New Session** tab.
2. Paste any YouTube URL (e.g. `https://www.youtube.com/watch?v=UF8uR6Z6KLc`) into the top ingestion bar and click **Auto-Analyze Video**.
3. *Alternatively*, click any of the **Curated Talks** pills (Shreyas Doshi, Elena Verna, Marty Cagan) to load instant transcripts.

### Step 2: Review the Extracted Intelligence
- **Claims Tab:** Review the 3–5 sharp claims extracted from the talk.
- **Summary Tab:** Read the high-density executive summary and 4 key operational takeaways.
- **Timestamps Tab:** Scan the transcript segments with clickable timestamps that seek the video.

### Step 3: Select a Claim & Choose a Cognitive Action
1. Click **Challenge & Synthesize** on the claim you want to internalize.
2. Select your cognitive angle:
   - **Contrarian Teardown:** Where does this advice fail or cause harm?
   - **Real-World Application:** How will you apply this to your current roadmap?
   - **First-Principles Audit:** What unstated assumptions is the speaker making?
3. Write your original thesis in the prompt editor (minimum 25 characters).

### Step 4: Evaluate & Save to Vault
1. Click **Analyze & Save Synthesis**.
2. Recap generates a rubric score (Synthesis Depth, Logical Rigor, Actionability) and poses a **Blindspot Challenge**.
3. Choose your spaced revisit cadence (e.g., *7 Days*, *14 Days*, *30 Days*) and click **Save to Knowledge Vault**.

### Step 5: Practice Spaced Recall
1. Open the **Dashboard** to view items that are **Due for Revisit**.
2. Click **Start Active Recall Drill** to generate a dynamic scenario question testing whether you can re-apply the principle.
3. Submit your recall answer to update your retention half-life and maintain your daily streak.

---

## 🔌 API Reference

The backend Express server exposes several dedicated endpoints under `/api`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/fetch-youtube` | Ingests a YouTube URL, parses metadata/captions, and generates an executive summary and thesis claims. |
| `POST` | `/api/extract-claims` | Extracts 3–5 distinct, testable claims from raw transcript text. |
| `POST` | `/api/generate-prompt` | Generates a targeted cognitive action prompt based on selected claim and action type. |
| `POST` | `/api/synthesize-and-save` | Evaluates user response against cognitive rubrics and identifies blindspots. |
| `GET`  | `/api/vault` | Retrieves all saved syntheses and revisit schedules. |
| `POST` | `/api/vault` | Adds or updates a saved synthesis in the vault. |
| `DELETE` | `/api/vault/:id` | Deletes a saved synthesis item. |
| `POST` | `/api/vault/:id/revisit` | Records an active recall session and schedules the next review date. |
| `POST` | `/api/generate-recall-drill` | Generates an active recall challenge for a previously saved insight. |
| `POST` | `/api/evaluate-recall` | Grades the user's recall response and provides corrective feedback. |
| `GET`  | `/api/revisit-analytics` | Computes retention metrics, streak count, and revisit health rates. |

---

## 🧠 Pedagogical Foundations

Recap is designed around established principles of cognitive science:
1. **The Generation Effect:** Information is significantly better remembered if it is actively generated from one's own mind rather than read or reviewed passively (Slamecka & Graf, 1978).
2. **Spaced Repetition:** Re-encountering concepts at expanding intervals resets the memory decay curve, moving ideas from working memory into long-term mental models (Ebbinghaus, 1885).
3. **Desirable Difficulties:** Introducing cognitive friction (counter-argument construction, assumption testing) creates deeper neural pathways and more flexible conceptual transfer (Bjork, 1994).

---

## 🛡️ License

Distributed under the **MIT License**. See `LICENSE` for more information.
