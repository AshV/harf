import fs from 'fs';
import path from 'path';

const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';
const SOURCES_MD_PATH = path.resolve('SOURCES.md');
const SOURCES_JSON_PATH = path.resolve('content/sources.json');
const RAW_DIR = path.resolve('content/raw');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function cleanWikiHtml(html) {
  if (!html) return '';

  return html
    // Remove styles and scripts
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    // Remove Wikisource header / footer banners and navigation tables
    .replace(/<div class="ws-noexport[^"]*"[^>]*>.*?<\/div>/gis, '')
    .replace(/<div class="header[^"]*"[^>]*>.*?<\/div>/gis, '')
    .replace(/<table class="headerTable[^"]*"[^>]*>.*?<\/table>/gis, '')
    // Replace headings
    .replace(/<h[1-2][^>]*>(.*?)<\/h[1-2]>/gi, '\n\n## $1\n\n')
    .replace(/<h[3-6][^>]*>(.*?)<\/h[3-6]>/gi, '\n\n### $1\n\n')
    // Replace blockquotes
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (_, q) => {
      const cleanQ = q.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return `\n\n> ${cleanQ}\n\n`;
    })
    // Replace paragraph tags with newlines
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    // Strip all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&#8203;/g, '')
    .replace(/&#32;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    // Normalize spaces and multiple newlines
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .normalize('NFC');
}

export async function fetchWikiPage(title) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(`API Error: ${data.error.info}`);
  return data.parse?.text?.['*'] || '';
}

export function logSourceRecord(record) {
  ensureDir(path.dirname(SOURCES_JSON_PATH));
  let sourcesList = [];
  if (fs.existsSync(SOURCES_JSON_PATH)) {
    try {
      sourcesList = JSON.parse(fs.readFileSync(SOURCES_JSON_PATH, 'utf-8'));
    } catch {
      sourcesList = [];
    }
  }

  // Update or add
  const existingIdx = sourcesList.findIndex((s) => s.id === record.id);
  if (existingIdx >= 0) {
    sourcesList[existingIdx] = record;
  } else {
    sourcesList.push(record);
  }

  fs.writeFileSync(SOURCES_JSON_PATH, JSON.stringify(sourcesList, null, 2));

  // Regenerate SOURCES.md
  let md = `# हर्फ़ (Harf) — प्रामाणिक स्रोत एवं कॉपीराइट लॉग (Verified Public Domain Sources)\n\n`;
  md += `> यह फ़ाइल पुस्तकालय में शामिल प्रत्येक रचना के मूल स्रोत, ऐतिहासिक संदर्भ और भारतीय कॉपीराइट अधिनियम (Indian Copyright Act, 1957) के तहत सार्वजनिक डोमेन (Public Domain) स्थिति का आधिकारिक विवरण सहेजती है।\n\n`;
  md += `---\n\n`;

  for (let i = 0; i < sourcesList.length; i++) {
    const s = sourcesList[i];
    md += `### ${i + 1}. ${s.title_hi} (${s.title_en})\n`;
    md += `- **रचनाकार (Author):** ${s.author_hi} (${s.author_en})\n`;
    md += `- **विधा (Category):** ${s.category_hi} (${s.category_en})\n`;
    md += `- **मूल प्रकाशन वर्ष (Published Year):** ${s.published_year || 'अज्ञात'}\n`;
    md += `- **सार्वजनिक डोमेन स्थिति (Copyright Status):** ${s.copyright_status}\n`;
    md += `- **प्राथमिक स्रोत (Source Repository):** [${s.repository}](${s.source_url})\n`;
    md += `- **सत्यापन तिथि (Verified On):** ${s.ingested_at}\n`;
    md += `- **अध्याय / सर्ग विवरण:** ${s.chapter_count} भाग / अध्याय\n`;
    md += `- **सत्यापन टिप्पणी:** ${s.verification_notes}\n\n`;
    md += `---\n\n`;
  }

  fs.writeFileSync(SOURCES_MD_PATH, md);
  console.log(`[SOURCES] Successfully updated provenance log at ${SOURCES_MD_PATH}`);
}
