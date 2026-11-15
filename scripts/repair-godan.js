import fs from 'fs';
import path from 'path';
import { cleanWikiHtml } from './fetch-wikisource.js';

const RAW_DIR = path.resolve('content/raw');
const GODAN_FILE = path.join(RAW_DIR, 'godaan.md');
const SOURCES_MD_PATH = path.resolve('SOURCES.md');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWikiPage(title, retries = 3) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`;
  for (let a = 1; a <= retries; a++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'HarfDigitalLibrary/1.0 (dev.harflibrary@gmail.com)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data?.parse?.text?.['*'] || '';
    } catch (e) {
      console.warn(`[RETRY ${a}/${retries}] Failed to fetch "${title}": ${e.message}`);
      await sleep(1500 * a);
    }
  }
  return '';
}

function cleanChapterBody(cleanedText, chNum) {
  let lines = cleanedText.split('\n');
  let startIdx = 0;

  // Skip top Wikisource navigation lines
  while (startIdx < lines.length) {
    const l = lines[startIdx].trim();
    if (!l) {
      startIdx++;
      continue;
    }
    if (
      l.includes('पीछे') ||
      l.includes('आगे') ||
      l.includes('←') ||
      l.includes('→') ||
      l.includes('गो-दान') ||
      l.includes('प्रेमचंद') ||
      l.includes('द्वारा') ||
      /^\(?1936\)?$/.test(l) ||
      /^[०-९\d]+$/.test(l)
    ) {
      startIdx++;
    } else {
      break;
    }
  }

  // Remove trailing Wikisource disclaimers if any
  let body = lines.slice(startIdx).join('\n').trim();
  body = body.replace(/यह कार्य\s+भारत में\s+सार्वजनिक डोमेन[\s\S]*$/gi, '');
  body = body.replace(/Public domain[\s\S]*$/gi, '');

  return body.trim();
}

async function main() {
  console.log('====================================================');
  console.log('REPAIRING GODAN (गोदान - मुंशी प्रेमचंद)');
  console.log('Fetching all 36 chapters from Hindi Wikisource...');
  console.log('====================================================');

  const devNums = [
    '१', '२', '३', '४', '५', '६', '७', '८', '९', '१०',
    '११', '१२', '१३', '१४', '१५', '१६', '१७', '१८', '१९', '२०',
    '२१', '२२', '२३', '२४', '२५', '२६', '२७', '२८', '२९', '३०',
    '३१', '३२', '३३', '३४', '३५', '३६'
  ];

  const chapters = [];
  let totalWords = 0;

  for (let i = 0; i < devNums.length; i++) {
    const num = devNums[i];
    const pageTitle = `गो-दान/${num}`;
    console.log(` -> Fetching chapter ${i + 1}/36 (${pageTitle})...`);

    const rawHtml = await fetchWikiPage(pageTitle);
    if (!rawHtml) {
      throw new Error(`Failed to fetch chapter ${i + 1}: ${pageTitle}`);
    }

    const cleaned = cleanWikiHtml(rawHtml);
    const body = cleanChapterBody(cleaned, i + 1);
    const words = body.split(/\s+/).filter(Boolean).length;
    totalWords += words;

    chapters.push({
      num: i + 1,
      devNum: num,
      title: `अध्याय ${num}`,
      body,
      words
    });

    await sleep(400);
  }

  console.log(`\nSuccessfully fetched all 36 chapters! Total words: ~${totalWords}`);

  let mdContent = `---
id: godaan
title: गोदान
title_en: Godan
author: मुंशी प्रेमचंद
author_en: Munshi Premchand
category: उपन्यास
category_en: Novel
published_year: 1936
description: >-
  किसान जीवन का महाकाव्य। होरी महतो, धनिया, गोबर, भोला और रायसाहब के माध्यम से
  भारतीय ग्रामीण समाज, ऋण-ग्रस्तता, सामंती शोषण और मर्यादा के संघर्ष का अमर भारतीय उपन्यास।
  हिन्दी साहित्य का कालजयी गौरव-ग्रंथ व यूपीएससी/पीसीएस पाठ्यक्रम का अनिवार्य उपन्यास।
keywords:
  - godan
  - godaan
  - hori
  - dhaniya
  - gobar
  - premchand
  - munshi premchand
  - upanyas
  - novel
  - kisan
  - upsc
  - uppsc
  - bpsc
cover: ''
---
`;

  for (const ch of chapters) {
    mdContent += `\n# ${ch.title}\n\n${ch.body}\n`;
  }

  fs.writeFileSync(GODAN_FILE, mdContent, 'utf-8');
  console.log(`[DONE] Wrote complete 36-chapter Godan to ${GODAN_FILE} (${mdContent.length} bytes)`);
}

main().catch((err) => {
  console.error('Fatal error repairing Godan:', err);
  process.exit(1);
});
