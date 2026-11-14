import fs from 'fs';
import path from 'path';
import { cleanWikiHtml, fetchWikiPage, logSourceRecord } from './fetch-wikisource.js';

const RAW_DIR = path.resolve('content/raw');
const DEVA = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

function toDeva(num) {
  return String(num).split('').map(c => DEVA[parseInt(c, 10)]).join('');
}

async function run() {
  console.log('[PARIKSHA-GURU] Fetching all 41 prakarans...');

  let mdContent = `---
id: "pariksha-guru"
title: "परीक्षा गुरु"
title_en: "Pariksha Guru"
author: "लाला श्रीनिवास दास"
author_en: "Lala Srinivas Das"
category: "उपन्यास"
category_en: "Novel"
published_year: 1882
description: "आचार्य रामचंद्र शुक्ल द्वारा मान्य आधुनिक हिन्दी का प्रथम मौलिक उपन्यास। लाला मदनमोहन की फिजूलखर्ची, चापलूस मित्रों का कुचक्र और सच्चे मित्र लाला ब्रजकिशोर की निष्ठा व कानूनी विवेक की अमर शिक्षाप्रद दास्तान।"
keywords: ["pariksha guru", "lala srinivas das", "upanyas", "first hindi novel", "madanmohan", "brajkishore", "delhi", "social novel"]
cover: ""
---

`;

  let totalChapters = 0;
  for (let i = 1; i <= 41; i++) {
    const d = toDeva(i);
    const variants = [
      `परीक्षा गुरु/प्रकरण ${d}`,
      `परीक्षा गुरु/${d}`,
      `परीक्षा गुरु ${d}`,
      `परीक्षा गुरु/प्रकरण ${i}`,
      `परीक्षा गुरु ${i}`,
      `परीक्षा गुरु/${i}`
    ];

    let found = false;
    for (const v of variants) {
      try {
        const html = await fetchWikiPage(v);
        const clean = cleanWikiHtml(html);
        if (clean.length > 50) {
          mdContent += `\n# प्रकरण ${d} (अध्याय ${d})\n\n${clean}\n\n`;
          totalChapters++;
          found = true;
          console.log(`[PARIKSHA-GURU] Ingested Prakaran ${d} from "${v}" (${clean.length} chars)`);
          break;
        }
      } catch {
        // try next variant
      }
    }

    if (!found) {
      console.warn(`[PARIKSHA-GURU] Warning: Could not find Prakaran ${d} (${i})`);
    }
  }

  const filePath = path.join(RAW_DIR, 'pariksha-guru.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[PARIKSHA-GURU] Successfully saved ${filePath} with ${totalChapters} prakarans.`);

  logSourceRecord({
    id: 'pariksha-guru',
    title_hi: 'परीक्षा गुरु',
    title_en: 'Pariksha Guru',
    author_hi: 'लाला श्रीनिवास दास',
    author_en: 'Lala Srinivas Das',
    category_hi: 'उपन्यास',
    category_en: 'Novel',
    published_year: 1882,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/परीक्षा_गुरु',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१८८२ के प्रथम संस्करण से हिन्दी विकिस्रोत पर सत्यापित हिन्दी का प्रथम मौलिक उपन्यास।'
  });
}

run();
