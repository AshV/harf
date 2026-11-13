import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const RAW_DIR = path.resolve('content/raw');
const OUTPUT_CONTENT_DIR = path.resolve('public/content');
const BOOKS_OUTPUT_DIR = path.join(OUTPUT_CONTENT_DIR, 'books');
const SITEMAP_PATH = path.resolve('public/sitemap.xml');

// Average reading speed: 180 Hindi words per minute
const WORDS_PER_MINUTE = 180;

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function countHindiWords(text) {
  if (!text) return 0;
  // Match whitespace separated words, removing punctuation
  const clean = text.replace(/[।.,?!;:"'()\[\]{}—–-]/g, ' ').trim();
  return clean ? clean.split(/\s+/).length : 0;
}

function parseMarkdownChapters(content) {
  // Normalize Unicode NFC to prevent split conjuncts / matras
  const normalized = content.normalize('NFC');
  
  // Split by markdown H1 headers (# Header)
  const lines = normalized.split('\n');
  const chapters = [];
  let currentChapter = null;
  let currentBlocks = [];
  let blockIndex = 1;

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      // If we already had an active chapter, save it
      if (currentChapter) {
        currentChapter.blocks = currentBlocks;
        chapters.push(currentChapter);
      }
      
      const chNumber = chapters.length + 1;
      const chTitle = trimmed.substring(2).trim();
      currentChapter = {
        id: `ch_${String(chNumber).padStart(2, '0')}`,
        number: chNumber,
        title: chTitle,
        blocks: []
      };
      currentBlocks = [];
      blockIndex = 1;
    } else if (trimmed.length > 0) {
      if (!currentChapter) {
        // Content before the first # header becomes Prologue / Chapter 1
        currentChapter = {
          id: 'ch_01',
          number: 1,
          title: 'आरंभ',
          blocks: []
        };
      }

      // Check block type (quote vs heading vs normal paragraph)
      let type = 'p';
      let text = trimmed;

      if (trimmed.startsWith('> ')) {
        type = 'quote';
        text = trimmed.substring(2).trim();
      } else if (trimmed.startsWith('## ')) {
        type = 'h2';
        text = trimmed.substring(3).trim();
      }

      currentBlocks.push({
        id: `b_${blockIndex++}`,
        type,
        text
      });
    }
  }

  // Push final chapter
  if (currentChapter) {
    currentChapter.blocks = currentBlocks;
    chapters.push(currentChapter);
  }

  return chapters;
}

function processBook(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data: frontmatter, content } = matter(fileContent);

  if (!frontmatter.id || !frontmatter.title) {
    console.warn(`[INGEST] Skipping ${filePath}: missing id or title in frontmatter.`);
    return null;
  }

  console.log(`[INGEST] Processing: ${frontmatter.title} (${frontmatter.id})`);

  const bookDir = path.join(BOOKS_OUTPUT_DIR, frontmatter.id);
  ensureDir(bookDir);

  const rawChapters = parseMarkdownChapters(content);
  let totalWords = 0;
  const chapterManifest = [];

  for (const ch of rawChapters) {
    const chWordCount = ch.blocks.reduce((acc, b) => acc + countHindiWords(b.text), 0);
    totalWords += chWordCount;

    const chEstMinutes = Math.max(1, Math.round(chWordCount / WORDS_PER_MINUTE));
    const chFileName = `${ch.id}.json`;
    const chFilePath = path.join(bookDir, chFileName);

    // Save chapter JSON
    fs.writeFileSync(
      chFilePath,
      JSON.stringify(
        {
          book_id: frontmatter.id,
          chapter_id: ch.id,
          number: ch.number,
          title: ch.title,
          word_count: chWordCount,
          blocks: ch.blocks
        },
        null,
        2
      )
    );

    chapterManifest.push({
      id: ch.id,
      number: ch.number,
      title: ch.title,
      block_count: ch.blocks.length,
      word_count: chWordCount,
      estimated_minutes: chEstMinutes,
      file: `content/books/${frontmatter.id}/${chFileName}`
    });
  }

  const totalReadingMinutes = Math.max(1, Math.round(totalWords / WORDS_PER_MINUTE));

  const bookMeta = {
    id: frontmatter.id,
    title: frontmatter.title.normalize('NFC'),
    title_en: frontmatter.title_en || '',
    author: frontmatter.author.normalize('NFC'),
    author_en: frontmatter.author_en || '',
    category: frontmatter.category ? frontmatter.category.normalize('NFC') : 'सामान्य',
    category_en: frontmatter.category_en || 'General',
    description: frontmatter.description ? frontmatter.description.normalize('NFC') : '',
    cover_image: frontmatter.cover || '',
    published_year: frontmatter.published_year || null,
    keywords: frontmatter.keywords || [],
    total_words: totalWords,
    total_chapters: chapterManifest.length,
    estimated_reading_minutes: totalReadingMinutes,
    chapters: chapterManifest
  };

  // Write book meta.json
  fs.writeFileSync(path.join(bookDir, 'meta.json'), JSON.stringify(bookMeta, null, 2));

  return {
    id: bookMeta.id,
    title: bookMeta.title,
    title_en: bookMeta.title_en,
    author: bookMeta.author,
    author_en: bookMeta.author_en,
    category: bookMeta.category,
    category_en: bookMeta.category_en,
    description: bookMeta.description,
    cover_image: bookMeta.cover_image,
    total_chapters: bookMeta.total_chapters,
    estimated_reading_minutes: bookMeta.estimated_reading_minutes,
    keywords: bookMeta.keywords
  };
}

function generateSitemap(books) {
  const baseUrl = 'https://harf.pages.dev'; // or GitHub pages URL, relative URLs also supported
  const today = new Date().toISOString().split('T')[0];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Root URL
  xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

  // Each Book URL
  for (const book of books) {
    xml += `  <url>\n    <loc>${baseUrl}/#/book/${book.id}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
    xml += `  <url>\n    <loc>${baseUrl}/#/read/${book.id}/ch_01</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  xml += `</urlset>`;
  fs.writeFileSync(SITEMAP_PATH, xml);
  console.log(`[INGEST] Generated sitemap with ${books.length} books at ${SITEMAP_PATH}`);
}

function main() {
  ensureDir(RAW_DIR);
  ensureDir(BOOKS_OUTPUT_DIR);

  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.warn(`[INGEST] No .md files found in ${RAW_DIR}. Add manuscripts there.`);
  }

  const library = [];
  for (const file of files) {
    const filePath = path.join(RAW_DIR, file);
    const bookSummary = processBook(filePath);
    if (bookSummary) {
      library.push(bookSummary);
    }
  }

  const libraryFile = path.join(OUTPUT_CONTENT_DIR, 'library.json');
  fs.writeFileSync(libraryFile, JSON.stringify(library, null, 2));
  console.log(`[INGEST] Successfully indexed ${library.length} books into ${libraryFile}`);

  generateSitemap(library);
}

main();
