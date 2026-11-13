# Harf (हर्फ़) — Hindi E-Reader Master Plan & Architecture

> **Harf (हर्फ़)**: A high-performance, mobile-first, offline-capable digital library and e-reader dedicated to public domain Hindi literature.

---

## 1. Executive Summary & Core Decisions

| Domain | Decision | Rationale |
| :--- | :--- | :--- |
| **Target Platform** | Mobile-First Web (PWA) | Highest reach in India, zero friction, installable on mobile homescreens. |
| **Hosting (Phase 1)**| **GitHub Pages** (via GitHub Actions) | Frictionless setup, free, automatic CI/CD from Git repo. |
| **Hosting (Phase 2)**| **Cloudflare Pages** | Edge PoPs across 10+ Indian cities, unlimited bandwidth, Brotli compression. |
| **Content Model** | Curated Public Domain Books (Admin only) | No complex DRM needed, 100% legal, static CDN hosting. |
| **File Format** | Custom Chunked JSON Blocks (No EPUB/PDF) | 70% smaller than EPUB, instant chapter lazy-loading, easy bookmarking. |
| **Local Storage** | **IndexedDB via Dexie.js** | 100% offline reading, persistent storage via `navigator.storage.persist()`. |
| **Typography** | `Noto Serif Devanagari` + `Tiro Devanagari Hindi` | Proper handling of conjuncts (*संयुक्त अक्षर*), matras, and line-heights. |
| **Accessibility** | Native Browser Web Speech API (`hi-IN`) | Zero-cost, zero-latency, offline-capable Hindi audio read-along. |
| **SEO Strategy** | SSG Pre-rendering + Schema.org + Dual-script (Hindi/Hinglish) | Enables Google indexing for SPA; captures both Devanagari & Latin queries. |

---

## 2. Technology Stack & Dependencies

```
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│   React 19 + TypeScript + Vite 6 + Tailwind CSS v4     │
│   Router: React Router (HashRouter / SPA 404 mode)     │
│   Icons: Lucide React (featherweight SVG icons)        │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Local Data & Offline                  │
│   IndexedDB (Dexie.js v4) + Vite PWA Plugin (Workbox)  │
│   Storage Persistence API + CacheStorage API           │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│              Ingestion & Build Toolchain               │
│   Node.js (ESM) + Gray-matter (Frontmatter)            │
│   Markdown-it / Custom AST Chunk Parser                │
│   Sitemap Generator + Schema.org JSON-LD Injector      │
└────────────────────────────────────────────────────────┘
```

### Core Package List
* **Framework:** `react`, `react-dom`, `vite`
* **Language:** `typescript` (strict mode)
* **Styling:** `tailwindcss`, `@tailwindcss/typography`
* **Local Database:** `dexie`, `dexie-react-hooks`
* **PWA & Offline:** `vite-plugin-pwa`, `workbox-window`
* **Icons & Animation:** `lucide-react`, `framer-motion` (lightweight gestures)
* **Admin / Build Scripts:** `gray-matter`, `glob`, `sitemap`

---

## 3. SEO & Discoverability Strategy (Deep Dive)

Search engines in India receive queries in two scripts: **Devanagari** (e.g., `गोदान मुंशी प्रेमचंद`) and **Roman/Hinglish** (e.g., `Godan Munshi Premchand read online`). Our SEO architecture targets both simultaneously.

### A. The SPA Indexing Problem & The Static Prerender Solution
Standard Single-Page Apps (SPAs) serve an empty `<div id="root"></div>`. While Googlebot runs JS, indexing is delayed and social previews (WhatsApp, Twitter, Facebook) completely fail.

**Solution:** During the build step (`npm run build`), a prerender script generates static HTML snapshots for every book landing page (`/books/godaan/index.html`) containing:
1. Full book metadata, description, and chapter list.
2. The entire first chapter in static HTML for instant crawler indexing.
3. OpenGraph and Twitter meta cards.

### B. Dual-Script Title & Meta Architecture
Every book page features dual-script metadata to rank for both query types:

```html
<!-- Primary Meta Tags -->
<title>गोदान - मुंशी प्रेमचंद | Godan by Munshi Premchand (Free Hindi Book)</title>
<meta name="description" content="मुंशी प्रेमचंद द्वारा रचित प्रसिद्ध उपन्यास 'गोदान' मुफ़्त में ऑनलाइन और ऑफ़लाइन पढ़ें। Read Godan by Munshi Premchand free online on Harf.">
<meta name="keywords" content="गोदान, मुंशी प्रेमचंद, Godan, Munshi Premchand, Hindi novel, hindi upanyas, read hindi books online, free hindi epub">

<!-- Canonical & Alternate Language -->
<link rel="canonical" href="https://your-domain.com/books/godaan">
<meta http-equiv="content-language" content="hi">

<!-- OpenGraph / WhatsApp / Facebook Preview -->
<meta property="og:type" content="book">
<meta property="og:title" content="गोदान — मुंशी प्रेमचंद (पूर्ण उपन्यास)">
<meta property="og:description" content="किसान जीवन का महाकाव्य। हर्फ़ (Harf) पर मुफ़्त में पढ़ें, बिना इंटरनेट के भी।">
<meta property="og:image" content="https://your-domain.com/covers/godaan-social.webp">
<meta property="og:url" content="https://your-domain.com/books/godaan">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="गोदान | Godan by Munshi Premchand">
<meta name="twitter:image" content="https://your-domain.com/covers/godaan-social.webp">
```

### C. Structured Data (Schema.org / JSON-LD)
Injected statically on every book and chapter page so Google surfaces rich snippet cards (Author, Genre, Language):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Book",
  "name": "गोदान",
  "alternateName": "Godan",
  "author": {
    "@type": "Person",
    "name": "मुंशी प्रेमचंद",
    "alternateName": "Munshi Premchand"
  },
  "inLanguage": "hi",
  "genre": "सामाजिक उपन्यास (Realistic Fiction)",
  "workExample": {
    "@type": "Book",
    "bookFormat": "https://schema.org/EBook",
    "accessMode": ["textual"],
    "inLanguage": "hi"
  },
  "publisher": {
    "@type": "Organization",
    "name": "हर्फ़ (Harf Public Library)"
  },
  "description": "गोदान भारतीय किसान के संघर्ष, मर्यादा और संवेदना का कालजयी उपन्यास है।"
}
</script>
```

### D. Automated XML Sitemap Generation
Every run of the ingestion script updates `public/sitemap.xml` with:
* The root library (`/`) with `priority: 1.0`
* Each book page (`/books/:id`) with `priority: 0.9`
* Each chapter reading URL with `priority: 0.7`

---

## 4. Content Ingestion & Data Architecture

### A. Raw Content Workflow (Admin)
The admin writes or pastes books in standard Markdown inside `content/raw/<book-id>/`:

```markdown
---
id: "godaan"
title: "गोदान"
title_en: "Godan"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "उपन्यास"
category_en: "Novel"
cover: "/covers/godaan.webp"
published_year: 1936
description: "गोदान भारतीय किसान के संघर्ष, मर्यादा और संवेदना का कालजयी उपन्यास है।"
keywords: ["godan", "premchand", "upanyas", "kisan", "novel"]
---

# अध्याय १

होरी अपने दोनों बैलों को सानी-पानी देकर बाहर निकला, तो देखा कि धनिया अभी तक नहीं जागी।

संसार में गऊ बनने से काम नहीं चलता। जितना दबो, उतना ही लोग दबाते हैं।

# अध्याय २

होरी जब भोला के घर पहुँचा, तो भोला बैलों को बाँध रहा था।
```

### B. Ingestion Parser Script (`scripts/ingest.js`)
When running `npm run ingest`, the script:
1. Reads all files in `content/raw/*.md`.
2. Normalizes text using **Unicode NFC** (`text.normalize('NFC')`).
3. Splits content by `# ` headers into structured paragraph blocks with unique IDs.
4. Outputs optimized JSON chunks to `public/content/books/<book-id>/`:
   * `meta.json`: Metadata, chapter manifest, and reading time estimates.
   * `ch_01.json`, `ch_02.json`...: Array of blocks: `{ id: "b_1", type: "p", text: "..." }`.
5. Rebuilds `public/content/library.json` (the master catalog).
6. Generates `public/sitemap.xml` and pre-rendered SEO HTML files.

---

## 5. UI/UX & Design System (Devanagari Optimized)

### A. Screen Hierarchy
1. **होम (Library/Home):**
   * Top app bar: Logo (हर्फ़) + Search Input (supporting Devanagari & Hinglish).
   * Hero Card: "पढ़ना जारी रखें" (*Continue Reading*) with active book thumbnail and progress bar.
   * Category Filter Pills: *सभी (All)*, *ऑफ़लाइन (Saved)*, *उपन्यास (Novels)*, *कहानियाँ (Stories)*, *कविता (Poetry)*.
   * Responsive Book Grid (2 columns on mobile, 4 on tablet, 6 on desktop).
2. **पुस्तक विवरण (Book Detail):**
   * Blur-backdrop cover display.
   * Action buttons: "पढ़ना शुरू करें" (Primary) + "ऑफ़लाइन सहेजें" (Secondary).
   * Accordion Table of Contents (अध्याय सूची).
3. **पाठक दृश्य (Reading Canvas):**
   * Full bleed layout.
   * Bottom thumb zone navigation: Previous, Progress Slider (`अध्याय २ • ३५%`), Next, Settings (⚙️), Listen (🎧).
   * Bottom sheet for appearance: Font size slider, Themes, Font family toggle.

### B. Themes (Specially Calibrated)
```css
/* 1. कागज़ (Parchment) - Default: Best for long reading */
--bg-parchment: #FBF0D9;
--text-parchment: #2C221E;
--accent-parchment: #C05621;

/* 2. रात (OLED True Black): Battery saving for mobile screens */
--bg-night: #000000;
--text-night: #D6D3D1;
--accent-night: #F6AD55;

/* 3. दिन (Crisp Day): Clean, high contrast */
--bg-day: #FAFAFA;
--text-day: #18181B;
--accent-day: #1E40AF;

/* 4. शांत (Muted Olive / Green): Soothing for night reading */
--bg-sage: #EAEFE9;
--text-sage: #1E293B;
--accent-sage: #2D6A4F;
```

### C. Typography Rules
* **Font Family:** `'Noto Serif Devanagari', 'Tiro Devanagari Hindi', Georgia, serif;`
* **Line Height:** `1.85` (mandatory to prevent upper/lower matras from clipping).
* **Font Size Range:** `16px` to `28px` (default: `19px`).
* **Letter Spacing:** `0em` (never negative; maintains continuous headline/shirorekha).

---

## 6. Project Directory Structure

```text
harf/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions CI/CD to GitHub Pages
├── content/
│   └── raw/                    # Raw admin markdown manuscripts
│       ├── godaan.md
│       └── kaffan.md
├── scripts/
│   ├── ingest.js               # Parser: Markdown -> Normalized JSON
│   ├── generate-sitemap.js     # Builds sitemap.xml
│   └── prerender.js            # SSG snapshot generator for SEO
├── public/
│   ├── covers/                 # Book cover WebP images
│   ├── fonts/                  # Self-hosted Devanagari WOFF2 fonts
│   ├── content/                # Generated JSON books & library index
│   │   ├── library.json
│   │   └── books/
│   ├── favicon.ico
│   ├── manifest.json           # PWA Manifest
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── assets/                 # Icons, brand logos
│   ├── components/
│   │   ├── common/             # Button, Modal, Drawer, Toast
│   │   ├── library/            # BookCard, HeroContinueCard, CategoryPills
│   │   ├── reader/             # ReadingCanvas, BottomBar, SettingsSheet
│   │   ├── search/             # HinglishSearchModal
│   │   └── tts/                # AudioPlayerControls
│   ├── db/
│   │   └── index.ts            # Dexie.js database definition
│   ├── hooks/
│   │   ├── useBook.ts          # Chapter loader (Network -> IndexedDB fallback)
│   │   ├── useReadingProgress.ts # Position sync & viewport tracking
│   │   ├── useSettings.ts      # Theme, font-size persistent storage
│   │   └── useTTS.ts           # Web Speech API Hindi audio controller
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   └── ReaderLayout.tsx
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── BookDetailPage.tsx
│   │   ├── ReaderPage.tsx
│   │   └── OfflinePage.tsx
│   ├── utils/
│   │   ├── hinglish.ts         # Phonetic transliteration / search matching
│   │   ├── storage.ts          # Persistent storage check
│   │   └── text.ts             # NFC normalization & reading time calculation
│   ├── App.tsx
│   ├── index.css               # Tailwind v4 theme & font declarations
│   └── main.tsx
├── index.html                  # Shell HTML template with default SEO
├── 404.html                    # GitHub Pages SPA redirect fallback
├── vite.config.ts              # Base URL handling & PWA plugin config
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── MASTER_PLAN.md              # This document
```

---

## 7. Step-by-Step Implementation Roadmap

```
Sprint 1: Architecture Core & Content Pipeline
  - Initialize Vite + React + TypeScript + Tailwind CSS.
  - Setup scripts/ingest.js to convert Markdown to normalized JSON.
  - Add initial public domain sample books (Godaan, Kafan).
  - Verify Unicode NFC normalization and JSON chunking.

Sprint 2: Offline Database & PWA Engine
  - Configure Dexie.js (books, chapters, progress, bookmarks).
  - Setup vite-plugin-pwa with Workbox caching strategy for fonts and assets.
  - Implement navigator.storage.persist() call.
  - Implement full offline book download flow.

Sprint 3: The Reader Experience & Devanagari Typography
  - Self-host Noto Serif Devanagari fonts.
  - Build distraction-free reader canvas with virtualized scrolling.
  - Implement bottom settings sheet: 4 color themes, font size slider, line-height.
  - Persist user reading position per book automatically.

Sprint 4: Hinglish Search & Audio (TTS)
  - Implement bilingual search (matching both "Godan" and "गोदान").
  - Integrate Web Speech API (hi-IN) with paragraph auto-scroll and highlight.

Sprint 5: SEO & Pre-rendering Pipeline
  - Write prerender script to generate static HTML for book landing pages.
  - Inject Schema.org JSON-LD Book metadata.
  - Generate dynamic sitemap.xml and robots.txt.

Sprint 6: Deployment & CI/CD
  - Setup GitHub Actions workflow (.github/workflows/deploy.yml).
  - Add 404.html redirect for SPA routing on GitHub Pages.
  - Test performance with Lighthouse (Target: 95+ on Mobile Performance, PWA, SEO).
  - Document migration path to Cloudflare Pages.

