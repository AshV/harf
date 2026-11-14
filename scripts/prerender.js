import fs from 'fs';
import path from 'path';

const LIBRARY_PATH = path.resolve('public/content/library.json');
const BOOKS_CONTENT_DIR = path.resolve('public/content/books');
const PUBLIC_BOOK_DIR = path.resolve('public/book');
const DIST_BOOK_DIR = path.resolve('dist/book');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generatePrerenderedBookPages() {
  if (!fs.existsSync(LIBRARY_PATH)) {
    console.error(`Library manifest not found at ${LIBRARY_PATH}`);
    return;
  }

  const rawLibrary = fs.readFileSync(LIBRARY_PATH, 'utf-8');
  const library = JSON.parse(rawLibrary);

  console.log(`Generating SEO and social preview landing pages for ${library.length} books...`);

  library.forEach((book) => {
    // Attempt to load detailed manifest for chapters
    let manifest = null;
    const manifestPath = path.join(BOOKS_CONTENT_DIR, book.id, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch (e) {
        // Fall back to library summary
      }
    }

    const title = escapeHtml(book.title);
    const titleEn = escapeHtml(book.title_en);
    const author = escapeHtml(book.author);
    const authorEn = escapeHtml(book.author_en);
    const category = escapeHtml(book.category);
    const description = escapeHtml(book.description);
    const year = book.published_year ? escapeHtml(String(book.published_year)) : '';
    const readingTime = book.estimated_reading_minutes || 10;
    const chapters = manifest?.chapters || [];

    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: book.title,
      alternateName: book.title_en,
      author: {
        '@type': 'Person',
        name: book.author,
        alternateName: book.author_en
      },
      genre: book.category,
      inLanguage: 'hi',
      description: book.description,
      datePublished: year || undefined,
      numberOfPages: book.total_chapters || 1,
      publisher: {
        '@type': 'Organization',
        name: 'हर्फ़ (Harf)',
        url: 'https://harf.pages.dev',
        logo: {
          '@type': 'ImageObject',
          url: 'https://harf.pages.dev/pwa-512x512.png'
        }
      }
    });

    const chapterListHtml = chapters.length > 0
      ? `<ol class="chapter-list">
          ${chapters
            .map(
              (c) =>
                `<li><a href="../../#/read/${encodeURIComponent(book.id)}/${encodeURIComponent(
                  c.id
                )}">${escapeHtml(c.title)}</a> <span class="time">(${c.estimated_minutes} मिनट)</span></li>`
            )
            .join('\n')}
        </ol>`
      : '';

    const htmlContent = `<!DOCTYPE html>
<html lang="hi" dir="ltr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <!-- Primary Meta Tags -->
  <title>${title} — ${author} | हिन्दी ई-पुस्तक (हर्फ़)</title>
  <meta name="title" content="${title} — ${author} | हिन्दी ई-पुस्तक (हर्फ़)" />
  <meta name="description" content="${description}" />
  <meta name="author" content="${author}" />
  <meta name="keywords" content="${(book.keywords || []).join(', ')}, ${title}, ${author}, hindi classic, public domain" />
  <link rel="canonical" href="https://harf.pages.dev/book/${book.id}/" />

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="book" />
  <meta property="og:site_name" content="हर्फ़ (Harf) — कालजयी हिन्दी पुस्तकालय" />
  <meta property="og:url" content="https://harf.pages.dev/book/${book.id}/" />
  <meta property="og:title" content="${title} — ${author} (हर्फ़)" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="https://harf.pages.dev/pwa-512x512.png" />
  <meta property="og:image:width" content="512" />
  <meta property="og:image:height" content="512" />
  <meta property="og:image:alt" content="${title} — ${author}" />
  <meta property="og:locale" content="hi_IN" />
  <meta property="book:author" content="${author}" />
  <meta property="book:tag" content="${category}" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title} — ${author} | हर्फ़" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="https://harf.pages.dev/pwa-512x512.png" />

  <!-- Schema.org Structured Data -->
  <script type="application/ld+json">
${jsonLd}
  </script>

  <!-- Instant Browser Redirect to Harf SPA Reader -->
  <script>
    (function() {
      // Preserve path routing for static GitHub Pages / Cloudflare Pages hosts
      var currentPath = window.location.pathname;
      var match = currentPath.match(/\\/book\\/([^\\/]+)/);
      var bookId = match ? match[1] : '${book.id}';
      var base = currentPath.substring(0, currentPath.indexOf('/book/'));
      window.location.replace((base || '') + '/#/book/' + encodeURIComponent(bookId));
    })();
  </script>

  <style>
    :root {
      --bg: #FAF7F2;
      --card-bg: #FFFFFF;
      --text: #1F1916;
      --accent: #C85A32;
      --border: rgba(31, 25, 22, 0.12);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #14100E;
        --card-bg: #1E1714;
        --text: #FAF5E8;
        --accent: #E08E45;
        --border: rgba(250, 245, 232, 0.12);
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Serif Devanagari', serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.85;
      padding: 24px 16px;
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      max-width: 680px;
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 32px 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: rgba(200, 90, 50, 0.1);
      color: var(--accent);
      margin-bottom: 12px;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .author {
      font-size: 18px;
      opacity: 0.8;
      margin-bottom: 24px;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      font-size: 13px;
      opacity: 0.7;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }
    .description {
      font-size: 16px;
      line-height: 1.9;
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      width: 100%;
      text-align: center;
      background: var(--accent);
      color: #FFFFFF !important;
      text-decoration: none;
      font-weight: 700;
      font-size: 16px;
      padding: 14px 24px;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(200, 90, 50, 0.25);
      transition: transform 0.2s, opacity 0.2s;
    }
    .btn:hover {
      opacity: 0.95;
      transform: translateY(-1px);
    }
    .chapters-title {
      font-size: 16px;
      font-weight: 700;
      margin: 32px 0 12px 0;
      padding-top: 24px;
      border-top: 1px solid var(--border);
    }
    .chapter-list {
      padding-left: 20px;
      font-size: 14px;
    }
    .chapter-list li {
      margin-bottom: 8px;
    }
    .chapter-list a {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
    }
    .chapter-list a:hover {
      color: var(--accent);
      text-decoration: underline;
    }
    .time {
      opacity: 0.6;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <main class="container">
    <div class="brand">
      <span>✦ हर्फ़ (Harf) ई-पुस्तकालय</span>
    </div>

    <span class="badge">${category}</span>
    <h1>${title}</h1>
    <div class="author">रचनाकार: <strong>${author}</strong> (${authorEn})</div>

    <div class="meta">
      ${year ? `<span>📅 वर्ष: ${year}</span>` : ''}
      <span>⏱️ पठन समय: ~${readingTime} मिनट</span>
      <span>📖 कुल अध्याय: ${book.total_chapters}</span>
      <span>📜 कॉपीराइट: सार्वजनिक डोमेन (Public Domain)</span>
    </div>

    <div class="description">
      <p>${description}</p>
    </div>

    <a href="../../#/book/${encodeURIComponent(book.id)}" class="btn">
      यह पुस्तक अभी पढ़ें (Read Online Free) →
    </a>

    ${chapters.length > 0 ? `
      <h2 class="chapters-title">अध्याय अनुक्रमणिका</h2>
      ${chapterListHtml}
    ` : ''}
  </main>
</body>
</html>`;

    // Write to public/book/<id>/index.html
    const publicTargetDir = path.join(PUBLIC_BOOK_DIR, book.id);
    ensureDir(publicTargetDir);
    fs.writeFileSync(path.join(publicTargetDir, 'index.html'), htmlContent, 'utf-8');

    // If dist/ exists, write to dist/book/<id>/index.html
    if (fs.existsSync(path.resolve('dist'))) {
      const distTargetDir = path.join(DIST_BOOK_DIR, book.id);
      ensureDir(distTargetDir);
      fs.writeFileSync(path.join(distTargetDir, 'index.html'), htmlContent, 'utf-8');
    }
  });

  console.log(`Successfully generated SEO and preview landing pages for ${library.length} books.`);
}

// Execute when run as CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePrerenderedBookPages();
}
