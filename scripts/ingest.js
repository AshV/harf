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

function parseMarkdownChapters(content, frontmatter = {}) {
  // Normalize Unicode NFC to prevent split conjuncts / matras
  const normalized = content.normalize('NFC');
  const isPoetry = frontmatter.category === 'कविता';
  const rawChapters = normalized.split(/\n(?=# )/).filter(c => c.trim().length > 0);
  const chapters = [];

  for (const rawCh of rawChapters) {
    const trimmedRaw = rawCh.trim();
    if (!trimmedRaw) continue;

    let header = '';
    let body = '';

    if (trimmedRaw.startsWith('# ')) {
      const firstNl = trimmedRaw.indexOf('\n');
      header = firstNl === -1 ? trimmedRaw : trimmedRaw.slice(0, firstNl).trim();
      body = firstNl === -1 ? '' : trimmedRaw.slice(firstNl).trim();
    } else {
      header = '# आरंभ';
      body = trimmedRaw;
    }

    const chNumber = chapters.length + 1;
    const chTitle = header.replace(/^#\s*/, '').trim();
    const currentChapter = {
      id: `ch_${String(chNumber).padStart(2, '0')}`,
      number: chNumber,
      title: chTitle,
      blocks: []
    };

    let blockIndex = 1;
    const paragraphs = body.split(/\n\s*\n+/);

    for (const p of paragraphs) {
      const trimmedP = p.trim();
      if (!trimmedP) continue;

      // Skip stray metadata lines or scan dividers if any slipped through
      if (
        trimmedP === '___' ||
        /^_{3,}$/.test(trimmedP) ||
        /^(?:Layout\s*\d+|TEXT|HEADER|FOOTER)$/i.test(trimmedP) ||
        /^\(?\[?\s*[०-९\d]+\s*\]?\)?\.?$/.test(trimmedP) ||
        /^(?:This work is in the|Public domain|सार्वजनिक डोमेन|सार्वजनिक प्रभावक्षेत्र)/i.test(trimmedP)
      ) {
        continue;
      }

      let type = 'p';
      let text = trimmedP;

      if (trimmedP.startsWith('### ')) {
        type = 'h3';
        text = trimmedP.replace(/^###\s*/, '').trim();
      } else if (trimmedP.startsWith('## ')) {
        type = 'h2';
        text = trimmedP.replace(/^##\s*/, '').trim();
      } else if (trimmedP.startsWith('> ')) {
        type = 'quote';
        text = trimmedP
          .split('\n')
          .map(l => l.replace(/^>\s*/, '').trim())
          .filter(Boolean)
          .join(' ');
      } else if (isPoetry) {
        // In poetry, keep line breaks inside verse stanzas
        text = trimmedP;
      } else {
        // In prose, join soft-wrapped lines into a single flowing paragraph
        text = trimmedP
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .join(' ');
      }

      // Strip running headers or page numbers at start of block
      if (!isPoetry && text.length > 30) {
        text = text.replace(/^(?:\([\s०-९\d]+\)|\[[\s०-९\d]+\])\s*/, '');
        text = text.replace(/^(?:पहला|पहिला|दूसरा|तीसरा|चौथा|पांचवां)\s+(?:भाग|हिस्सा|खंड|खण्ड|अध्याय|बयान|प्रकरण|परिच्छेद)\s*/, '');
        text = text.replace(/^\|\s*/, '');
      }

      // If text has inline page number + title prefix (e.g. "( १६) भारतेन्दु बाबू हरिश्चन्द्र का जीवन चरित्र उनके साथ...")
      if (frontmatter.title && text.length > 50) {
        const titleWords = frontmatter.title
          .replace(/[^\u0900-\u097F\s]/g, '')
          .trim()
          .split(/\s+/)
          .filter(w => w.length >= 2);
        if (titleWords.length > 0) {
          const patternStr = '^(?:\\([\\s०-९\\d]+\\)|\\[[\\s०-९\\d]+\\]|[\\s०-९\\d]+)?\\s*(?:' + titleWords.map(w => {
            return w
              .replace(/ंद्र/g, '(?:ंद्र|न्द्र)')
              .replace(/ंत/g, '(?:ंत|न्त)')
              .replace(/ंप/g, '(?:ंप|म्प)')
              .replace(/ंब/g, '(?:ंब|म्ब)');
          }).join('\\s*') + ')\\s*';
          try {
            const inlinePrefixRegex = new RegExp(patternStr, 'u');
            text = text.replace(inlinePrefixRegex, '');
          } catch (e) {}
        }
      }

      if (text.trim().length > 0) {
        currentChapter.blocks.push({
          id: `b_${blockIndex++}`,
          type,
          text: text.trim()
        });
      }
    }

    if (currentChapter.blocks.length > 0) {
      chapters.push(currentChapter);
    }
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

  const rawChapters = parseMarkdownChapters(content, frontmatter);
  let totalWords = 0;
  const chapterManifest = [];

  // Remove any stale chapter JSON files from previous ingestions
  const currentChapterFiles = new Set(rawChapters.map(c => `${c.id}.json`));
  const existingFiles = fs.readdirSync(bookDir).filter(f => f.startsWith('ch_') && f.endsWith('.json'));
  for (const ef of existingFiles) {
    if (!currentChapterFiles.has(ef)) {
      fs.unlinkSync(path.join(bookDir, ef));
    }
  }

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
    published_year: bookMeta.published_year,
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

