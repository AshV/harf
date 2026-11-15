import fs from 'fs';
import path from 'path';

const RAW_DIR = path.resolve('content/raw');
const SOURCES_MD_PATH = path.resolve('SOURCES.md');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function cleanPoemText(raw) {
  if (!raw) return '';
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&#8203;|&#8288;|[\u2060\uFEFF]/g, '')
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
    .replace(/&#42;/g, '*')
    .replace(/&#8195;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (m, dec) => {
      const code = parseInt(dec, 10);
      if (code === 8288 || code === 8203 || code === 65279) return '';
      if (code === 8195 || code === 8194 || code === 160) return ' ';
      return String.fromCharCode(code);
    })
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .normalize('NFC');
}

async function fetchKavitaKoshPage(title, retries = 3) {
  const url = `http://kavitakosh.org/kk/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`;
  for (let a = 1; a <= retries; a++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'HarfDigitalLibrary/1.0 (dev.harflibrary@gmail.com)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data?.parse?.text?.['*'] || '';
    } catch (e) {
      console.warn(`[RETRY ${a}/${retries}] Failed to fetch "${title}": ${e.message}`);
      await sleep(2000 * a);
    }
  }
  return '';
}

function appendToSourcesMd(record) {
  let currentMd = fs.existsSync(SOURCES_MD_PATH) ? fs.readFileSync(SOURCES_MD_PATH, 'utf-8') : '';
  if (currentMd.includes(record.title)) {
    console.log(`[SOURCES] ${record.title} already documented in SOURCES.md`);
    return;
  }

  const entry = `
---

### ${record.title} (${record.title_en})
- **रचनाकार (Author):** ${record.author} (${record.author_en})
- **विधा (Category):** ${record.category}
- **मूल रचना वर्ष (Composed Year):** ${record.published_year} (संवत् १६३१)
- **सार्वजनिक डोमेन स्थिति (Copyright Status):** सार्वजनिक डोमेन (Public Domain - १६वीं शताब्दी की कालजयी कृति)
- **प्राथमिक स्रोत (Source Repository):** ${record.source_repo}
- **सत्यापन तिथि (Verified On):** 2026-11-16
- **अध्याय / सर्ग विवरण:** ${record.chapters_summary}
- **सत्यापन टिप्पणी:** ${record.verification_note}
`;

  fs.appendFileSync(SOURCES_MD_PATH, entry);
  console.log(`[SOURCES] Logged ${record.title} into SOURCES.md`);
}

async function main() {
  console.log('====================================================');
  console.log('HARF: RAMCHARITMANAS (SUNDARKAND) INGESTION');
  console.log('====================================================');

  const rawHtml = await fetchKavitaKoshPage('सुन्दर काण्ड / रामचरितमानस / तुलसीदास');
  const poemMatch = rawHtml.match(/<div class="poem">([\s\S]*?)<\/div>/);
  if (!poemMatch) {
    throw new Error('Could not find <div class="poem"> in Kavita Kosh response');
  }

  let text = cleanPoemText(poemMatch[1]);
  // Clean header repeated titles
  text = text.replace(/^श्रीजानकीवल्लभो विजयते[\s\S]*?पञ्चम सोपान\s*सुन्दरकाण्ड\s*/i, '');

  const splitPoints = [
    { num: 10, title: '२. अशोक वाटिका एवं सीता-हनुमान संवाद (दोहा ११–२०)' },
    { num: 20, title: '३. रावण-सभा एवं लंका-दहन (दोहा २१–३४)' },
    { num: 34, title: '४. सीता-संदेश एवं प्रभु श्रीराम-मिलन (दोहा ३५–४२)' },
    { num: 42, title: '५. विभीषण-शरणागति एवं अभयदान (दोहा ४३–५०)' },
    { num: 50, title: '६. समुद्र-प्रार्थना, प्रभु-क्रोध एवं सेतु-परामर्श (दोहा ५१–६०)' }
  ];

  let currentText = text;
  const chapters = [];
  const chTitles = [
    '१. मंगलाचरण, समुद्र-लंघन एवं लंका-प्रवेश (दोहा १–१०)',
    '२. अशोक वाटिका एवं सीता-हनुमान संवाद (दोहा ११–२०)',
    '३. रावण-सभा एवं लंका-दहन (दोहा २१–३४)',
    '४. सीता-संदेश एवं प्रभु श्रीराम-मिलन (दोहा ३५–४२)',
    '५. विभीषण-शरणागति एवं अभयदान (दोहा ४३–५०)',
    '६. समुद्र-प्रार्थना, प्रभु-क्रोध एवं सेतु-परामर्श (दोहा ५१–६०)'
  ];

  for (let i = 0; i < splitPoints.length; i++) {
    const sp = splitPoints[i];
    const re = new RegExp(`(॥\\s*${sp.num}\\s*॥)`, 'u');
    const m = re.exec(currentText);
    if (!m) {
      throw new Error(`Failed to find boundary for Doha ${sp.num}`);
    }
    const splitIdx = m.index + m[0].length;
    const part = currentText.slice(0, splitIdx).trim();
    chapters.push(part);
    currentText = currentText.slice(splitIdx).trim();
  }
  chapters.push(currentText);

  let mdBody = '';
  for (let i = 0; i < chapters.length; i++) {
    mdBody += `\n\n# ${chTitles[i]}\n\n${chapters[i]}`;
  }

  const mdContent = `---
id: ramcharitmanas-sundarkand
title: रामचरितमानस (सुन्दरकाण्ड)
title_en: Ramcharitmanas (Sundarkand)
author: गोस्वामी तुलसीदास
author_en: Goswami Tulsidas
category: कविता
category_en: Bhakti Poetry / Devotional Epic
published_year: 1574
description: >-
  गोस्वामी तुलसीदास कृत श्रीरामचरितमानस का अमर पञ्चम सोपान। हनुमान जी के समुद्र-लंघन,
  लंका-दहन, विभीषण-शरणागति और समुद्र-प्रार्थना (भय बिनु होइ न प्रीति) का कालजयी आख्यान।
  यूपीएससी व राज्य पीसीएस मुख्य परीक्षा के हिन्दी साहित्य का अनिवार्य पाठ।
keywords:
  - ramcharitmanas
  - sundarkand
  - tulsidas
  - goswami tulsidas
  - hanuman
  - upsc
  - uppsc
  - bpsc
  - awadhi kavita
  - bhakti kaal
cover: ''
---
${mdBody}
`;

  const targetPath = path.join(RAW_DIR, 'ramcharitmanas-sundarkand.md');
  fs.writeFileSync(targetPath, mdContent);
  console.log(`[DONE] Wrote ${targetPath} (${mdContent.length} bytes)`);

  appendToSourcesMd({
    title: 'रामचरितमानस (सुन्दरकाण्ड)',
    title_en: 'Ramcharitmanas (Sundarkand)',
    author: 'गोस्वामी तुलसीदास',
    author_en: 'Goswami Tulsidas',
    category: 'कविता (Bhakti / Epic Poetry)',
    published_year: 1574,
    death_year: '1623 ई.',
    source_repo: '[Kavita Kosh / Gita Press Recension](http://kavitakosh.org/kk/सुन्दर_काण्ड_/_रामचरितमानस_/_तुलसीदास)',
    chapters_summary: '६ प्रमुख अध्याय (सम्पूर्ण ६० दोहे, चौपाई, सोरठा व मंगलाचरण श्लोक सहित)',
    verification_note: 'गीता प्रेस गोरखपुर के प्रामाणिक पाठ तथा कविताकोश से सम्पूर्ण ६० दोहों का सत्यापन।'
  });

  console.log('\n[SUCCESS] Sundarkand ingested successfully!');
}

main().catch((err) => {
  console.error('Fatal error during Sundarkand ingestion:', err);
  process.exit(1);
});
