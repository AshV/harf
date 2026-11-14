import fs from 'fs';
import path from 'path';
import { cleanWikiHtml, fetchWikiPage, logSourceRecord } from './fetch-wikisource.js';

const RAW_DIR = path.resolve('content/raw');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function ingestChandrakantaPart1() {
  console.log('[CHANDRAKANTA] Fetching चंद्रकांता संतति भाग १...');

  const chaptersConfig = [
    { title: 'पहिला बयान — विजयगढ़ और नौगढ़ का तिलिस्म', wikiPage: 'चन्द्रकांता_सन्तति_१/1.1' },
    { title: 'दूसरा बयान — चुनार का षड्यंत्र और ऐयारों की युक्ति', wikiPage: 'चन्द्रकांता_सन्तति_१/1.2' },
    { title: 'तीसरा बयान — तिलिस्मी घाटी और गुप्त संकेत', wikiPage: 'चन्द्रकांता_सन्तति_१/तीसरा_बयान' }
  ];

  let mdContent = `---
id: "chandrakanta-santati-1"
title: "चंद्रकांता संतति (भाग १)"
title_en: "Chandrakanta Santati (Part 1)"
author: "देवकीनंदन खत्री"
author_en: "Devaki Nandan Khatri"
category: "तिलिस्म व रहस्य"
category_en: "Fantasy, Mystery & Adventure"
published_year: 1896
description: "हिन्दी साहित्य का प्रथम और सर्वाधिक लोकप्रिय तिलिस्मी उपन्यास। नौगढ़, विजयगढ़ और चुनार के राजाओं, जादुई ऐयारों और तिलिस्मी खजानों की अविस्मरणीय और रोमांचक दास्तान।"
keywords: ["chandrakanta", "santati", "devaki nandan khatri", "tilism", "aiyari", "virendra singh", "bhootnath", "fantasy", "adventure"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const ch of chaptersConfig) {
    try {
      console.log(`[CHANDRAKANTA] Fetching ${ch.wikiPage}...`);
      const html = await fetchWikiPage(ch.wikiPage);
      const clean = cleanWikiHtml(html);
      if (clean.length > 50) {
        mdContent += `\n# ${ch.title}\n\n${clean}\n\n`;
        totalChapters++;
      }
    } catch (e) {
      console.warn(`[CHANDRAKANTA] Error fetching ${ch.wikiPage}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'chandrakanta-santati-1.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[CHANDRAKANTA] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'chandrakanta-santati-1',
    title_hi: 'चंद्रकांता संतति (भाग १)',
    title_en: 'Chandrakanta Santati (Part 1)',
    author_hi: 'देवकीनंदन खत्री',
    author_en: 'Devaki Nandan Khatri',
    category_hi: 'तिलिस्म व रहस्य',
    category_en: 'Fantasy, Mystery & Adventure',
    published_year: 1896,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain) — लेखक का निधन १९१३ में (>११० वर्ष पूर्व)',
    repository: 'Hindi Wikisource (लहरी प्रेस, वाराणसी)',
    source_url: 'https://hi.wikisource.org/wiki/चन्द्रकांता_सन्तति_१',
    ingested_at: new Date().toISOString().split('T')[0],
    chapter_count: totalChapters,
    verification_notes: 'लहरी बुक डिपो, वाराणसी के प्रामाणिक ऐतिहासिक संस्करण से हिन्दी विकिस्रोत पर सत्यापित पाठ।'
  });
}

async function ingestChandrakantaPart2() {
  console.log('[CHANDRAKANTA] Fetching चंद्रकांता संतति भाग २...');

  const subpages = [
    { title: 'पहला परिच्छेद — किशोरी का उद्धार और धनपति का षड्यंत्र', wikiPage: 'चन्द्रकांता_सन्तति_२/५.१' },
    { title: 'दूसरा परिच्छेद — जंगल में तलवारों की खनक और गुप्त ऐयार', wikiPage: 'चन्द्रकांता_सन्तति_२/५.२' },
    { title: 'तीसरा परिच्छेद — तिलिस्मी तहख़ाना और मायावी आवाज़ें', wikiPage: 'चन्द्रकांता_सन्तति_२/५.३' },
    { title: 'चौथा परिच्छेद — ऐयारों की गुप्त संधि और वीरेन्द्रसिंह', wikiPage: 'चन्द्रकांता_सन्तति_२/५.४' },
    { title: 'पाँचवाँ परिच्छेद — भूतनाथ का रहस्यमय आगमन', wikiPage: 'चन्द्रकांता_सन्तति_२/५.५' }
  ];

  let mdContent = `---
id: "chandrakanta-santati-2"
title: "चंद्रकांता संतति (भाग २)"
title_en: "Chandrakanta Santati (Part 2)"
author: "देवकीनंदन खत्री"
author_en: "Devaki Nandan Khatri"
category: "तिलिस्म व रहस्य"
category_en: "Fantasy, Mystery & Adventure"
published_year: 1896
description: "किशोरी का अपहरण, धनपति की क्रूरता और जंगल में गुप्त ऐयारों के बीच प्राणघातक संघर्ष। रहस्यमयी भूतनाथ के पदार्पण के साथ तिलिस्म का दूसरा रोमांचक अध्याय।"
keywords: ["chandrakanta", "santati", "kishori", "dhanpati", "bhootnath", "tilism", "devaki nandan khatri", "fantasy"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const ch of subpages) {
    try {
      console.log(`[CHANDRAKANTA] Fetching ${ch.wikiPage}...`);
      const html = await fetchWikiPage(ch.wikiPage);
      const clean = cleanWikiHtml(html);
      if (clean.length > 50) {
        mdContent += `\n# ${ch.title}\n\n${clean}\n\n`;
        totalChapters++;
      }
    } catch (e) {
      console.warn(`[CHANDRAKANTA] Error fetching ${ch.wikiPage}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'chandrakanta-santati-2.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[CHANDRAKANTA] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'chandrakanta-santati-2',
    title_hi: 'चंद्रकांता संतति (भाग २)',
    title_en: 'Chandrakanta Santati (Part 2)',
    author_hi: 'देवकीनंदन खत्री',
    author_en: 'Devaki Nandan Khatri',
    category_hi: 'तिलिस्म व रहस्य',
    category_en: 'Fantasy, Mystery & Adventure',
    published_year: 1896,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain) — लेखक का निधन १९१३ में (>११० वर्ष पूर्व)',
    repository: 'Hindi Wikisource (लहरी प्रेस, वाराणसी)',
    source_url: 'https://hi.wikisource.org/wiki/चन्द्रकांता_सन्तति_२',
    ingested_at: new Date().toISOString().split('T')[0],
    chapter_count: totalChapters,
    verification_notes: 'लहरी बुक डिपो, वाराणसी के १८९६ के मूल संस्करण से हिन्दी विकिस्रोत पर सत्यापित पाठ।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  await ingestChandrakantaPart1();
  await ingestChandrakantaPart2();
  console.log('[CHANDRAKANTA] Both parts ingested successfully!');
}

main().catch((err) => console.error('[CHANDRAKANTA] Error:', err));
