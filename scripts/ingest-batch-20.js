import fs from 'fs';
import path from 'path';
import { cleanWikiHtml, fetchWikiPage, logSourceRecord } from './fetch-wikisource.js';
import https from 'node:https';

const RAW_DIR = path.resolve('content/raw');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanBatch20Text(text) {
  if (!text) return '';
  let cleaned = text;

  // Remove WIP banner
  cleaned = cleaned.replace(/^यह निर्माणाधीन पुस्तक है[^\n]*\n+/gm, '');
  cleaned = cleaned.replace(/^इसकी वर्तनी जाँच का कार्य[^\n]*\n+/gm, '');
  cleaned = cleaned.replace(/^आप इसमें हमारी मदद कर सकते हैं।[^\n]*\n+/gm, '');

  // Remove multi-line navigation headers at start
  while (true) {
    const next = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|पीछे|मुखपृष्ठ|मुख्यपृष्ठ|विषय प्रवेश|अगला भाग|अगला अध्याय|पिछला अध्याय|\(\d{4}\)|दुखी भारत|याक़ूती तख़्ती|सुखशर्वरी|भारतेंदु-नाटकावली)[^\n]*?\n+/i, '');
    if (next === cleaned) break;
    cleaned = next;
  }

  // Remove repeated hyphens or underscores
  cleaned = cleaned.replace(/^[_\-–—\s]{3,}\n+/gm, '');
  cleaned = cleaned.replace(/(?:^[\s\-–—_]{1,3}\n+){2,}/gm, '');

  // Remove copyright / public domain disclaimers at end
  cleaned = cleaned.replace(/(?:पर सभी दस्तावेज सार्वजनिक प्रभावक्षेत्र|यह कार्य\s+संयुक्त राज्य अमेरिका|सार्वजनिक प्रभावक्षेत्र में आया था|कॉपीराइट पंजीकरण नहीं है|Public domain)[\s\S]*$/gi, '');

  return cleaned.trim();
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'HarfBot/1.0 (https://github.com/harf; harf@example.com)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function devanagariToNumber(str) {
  const map = { '०': 0, '१': 1, '२': 2, '३': 3, '४': 4, '५': 5, '६': 6, '७': 7, '८': 8, '९': 9 };
  const digits = str.replace(/[^\u0966-\u096F]/g, '');
  if (!digits) return 999;
  return Number(digits.replace(/[\u0966-\u096F]/g, d => map[d]));
}

// 1. Ingest Dukhi Bharat (दुखी भारत - लाला लाजपत राय)
async function ingestDukhiBharat() {
  console.log('[BATCH-20] 1/5 Fetching दुखी भारत (लाला लाजपत राय)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('दुखी भारत/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  function getWeight(t) {
    const sub = t.replace(/^दुखी भारत\//, '').trim();
    if (sub.includes('विषय प्रवेश')) return 0;
    if (sub.includes('मदर इंडिया')) return 999;
    const m = sub.match(/^([०-९]+)/);
    return m ? devanagariToNumber(m[1]) : 500;
  }

  subpages.sort((a, b) => getWeight(a) - getWeight(b));

  let mdContent = `---
id: "dukhi-bharat"
title: "दुखी भारत"
title_en: "Dukhi Bharat (Unhappy India)"
author: "लाला लाजपत राय"
author_en: "Lala Lajpat Rai"
category: "इतिहास व संस्कृति"
category_en: "History, Sociology & Nationalism"
published_year: 1928
description: "पंजाब केसरी लाला लाजपत राय द्वारा रचित ऐतिहासिक एवं समाजशास्त्रीय महाग्रंथ। कैथरीन मेयो की पूर्वाग्रहपूर्ण पुस्तक 'मदर इंडिया' के तार्किक प्रत्युत्तर में भारतीय समाज, शिक्षा, नारी-सम्मान, संस्कृति, आर्थिक शोषण और राष्ट्रीय स्वाभिमान का ३५ अध्यायों में प्रामाणिक विश्लेषण।"
keywords: ["dukhi bharat", "unhappy india", "lala lajpat rai", "mother india", "indian history", "nationalism", "indian freedom struggle"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^दुखी भारत\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch20Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-20] Ingested Dukhi Bharat chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-20] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'dukhi-bharat.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-20] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'dukhi-bharat',
    title_hi: 'दुखी भारत',
    title_en: 'Dukhi Bharat (Unhappy India)',
    author_hi: 'लाला लाजपत राय',
    author_en: 'Lala Lajpat Rai',
    category_hi: 'इतिहास व संस्कृति',
    category_en: 'History, Sociology & Nationalism',
    published_year: 1928,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/दुखी_भारत',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२८ इंडियन प्रेस, लिमिटेड, प्रयाग से प्रकाशित पंजाब केसरी लाला लाजपत राय (१८६५–१९२८) का ३५ अध्यायों का ऐतिहासिक समाजशास्त्रीय व राष्ट्रीय ग्रन्थ।'
  });
}

// 2. Ingest Tilismi Mundari (तिलिस्माती मुँदरी - श्रीधर पाठक)
async function ingestTilismiMundari() {
  console.log('[BATCH-20] 2/5 Fetching तिलिस्माती मुँदरी (श्रीधर पाठक)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('तिलिस्माती मुँदरी/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const nA = Number(a.replace(/^तिलिस्माती मुँदरी\//, ''));
    const nB = Number(b.replace(/^तिलिस्माती मुँदरी\//, ''));
    return nA - nB;
  });

  let mdContent = `---
id: "tilismi-mundari"
title: "तिलिस्माती मुँदरी"
title_en: "Tilismi Mundari"
author: "श्रीधर पाठक"
author_en: "Shridhar Pathak"
category: "उपन्यास"
category_en: "Novel / Fantasy & Adventure"
published_year: 1927
description: "आधुनिक खड़ी बोली के प्रवर्तक कवि व साहित्यकार श्रीधर पाठक द्वारा रचित रहस्य-रोमांच और तिलिस्मी आख्यान। हिमालय की सुरम्य घाटियों, गंगा के उद्गम, जादुई मुँदरी और साहसिक घटनाओं से सुसज्जित ९ अध्यायों का दुर्लभ गद्य उपन्यास।"
keywords: ["tilismi mundari", "shridhar pathak", "adventure novel", "mystery", "magic ring", "early hindi novel"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^तिलिस्माती मुँदरी\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch20Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# अध्याय ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-20] Ingested Tilismi Mundari chapter ${totalChapters}/${subpages.length}: अध्याय ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-20] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'tilismi-mundari.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-20] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'tilismi-mundari',
    title_hi: 'तिलिस्माती मुँदरी',
    title_en: 'Tilismi Mundari',
    author_hi: 'श्रीधर पाठक',
    author_en: 'Shridhar Pathak',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Fantasy & Adventure',
    published_year: 1927,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/तिलिस्माती_मुँदरी',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२७ (पंडित गिरिधर पाठक, इलाहाबाद) से प्रकाशित खड़ी बोली के प्रमुख युगनिर्माता श्रीधर पाठक (१८५८–१९२८) का ९ अध्यायों का तिलिस्मी गद्य उपन्यास।'
  });
}

// 3. Ingest Yaquti Takhti (याक़ूती तख़्ती - पं. किशोरीलाल गोस्वामी)
async function ingestYaqutiTakhti() {
  console.log('[BATCH-20] 3/5 Fetching याक़ूती तख़्ती (पं. किशोरीलाल गोस्वामी)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('याक़ूती तख़्ती/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const subA = a.replace(/^याक़ूती तख़्ती\/\s*परिच्छेद\s*/, '').trim();
    const subB = b.replace(/^याक़ूती तख़्ती\/\s*परिच्छेद\s*/, '').trim();
    const nA = devanagariToNumber(subA);
    const nB = devanagariToNumber(subB);
    return nA - nB;
  });

  let mdContent = `---
id: "yaquti-takhti"
title: "याक़ूती तख़्ती"
title_en: "Yaquti Takhti"
author: "पं. किशोरीलाल गोस्वामी"
author_en: "Pt. Kishorilal Goswami"
category: "उपन्यास"
category_en: "Novel / Mystery & Adventure"
published_year: 1906
description: "पं. किशोरीलाल गोस्वामी का रहस्य, साहस और सीमांत पठानों की पृष्ठभूमि पर आधारित शास्त्रीय उपन्यास। लाल याक़ूत की रहस्यमयी तख़्ती, वीरता, षड्यंत्र और नाटकीय मोड़ों से भरपूर १३ परिच्छेदों का रोचक आख्यान।"
keywords: ["yaquti takhti", "kishorilal goswami", "historical novel", "mystery", "early hindi novel"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^याक़ूती तख़्ती\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch20Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-20] Ingested Yaquti Takhti chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-20] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'yaquti-takhti.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-20] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'yaquti-takhti',
    title_hi: 'याक़ूती तख़्ती',
    title_en: 'Yaquti Takhti',
    author_hi: 'पं. किशोरीलाल गोस्वामी',
    author_en: 'Pt. Kishorilal Goswami',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Mystery & Adventure',
    published_year: 1906,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/याक़ूती_तख़्ती',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९०६ में प्रकाशित पं. किशोरीलाल गोस्वामी (१८६५–१९३२) का १३ अध्यायों का ऐतिहासिक-रोमांचक उपन्यास।'
  });
}

// 4. Ingest Sukhasharvari (सुखशर्वरी - पं. किशोरीलाल गोस्वामी)
async function ingestSukhasharvari() {
  console.log('[BATCH-20] 4/5 Fetching सुखशर्वरी (पं. किशोरीलाल गोस्वामी)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('सुखशर्वरी/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const nA = Number(a.replace(/^सुखशर्वरी\/\s*भाग\s*/, ''));
    const nB = Number(b.replace(/^सुखशर्वरी\/\s*भाग\s*/, ''));
    return nA - nB;
  });

  let mdContent = `---
id: "sukhasharvari"
title: "सुखशर्वरी"
title_en: "Sukhasharvari"
author: "पं. किशोरीलाल गोस्वामी"
author_en: "Pt. Kishorilal Goswami"
category: "उपन्यास"
category_en: "Novel / Classical Romantic Fiction"
published_year: 1908
description: "पं. किशोरीलाल गोस्वामी द्वारा रचित शास्त्रीय सामाजिक व भावुक उपन्यास। श्मशान के रहस्य, मानवीय संवेदनाओं, प्रेम, संघर्ष और विरह-मिलन की अनूठी कथा का ६ भागों में विस्तृत परिदृश्य।"
keywords: ["sukhasharvari", "kishorilal goswami", "classical novel", "hindi fiction", "romantic drama"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^सुखशर्वरी\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch20Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-20] Ingested Sukhasharvari part ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-20] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'sukhasharvari.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-20] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'sukhasharvari',
    title_hi: 'सुखशर्वरी',
    title_en: 'Sukhasharvari',
    author_hi: 'पं. किशोरीलाल गोस्वामी',
    author_en: 'Pt. Kishorilal Goswami',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Classical Romantic Fiction',
    published_year: 1908,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/सुखशर्वरी',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९०८ सुदर्शन प्रेस, वृन्दावन से प्रकाशित पं. किशोरीलाल गोस्वामी (१८६५–१९३२) का ६ भागों का भावुक सामाजिक उपन्यास।'
  });
}

// 5. Ingest Natak Aur Rangmanch (नाटक और रंगमंच - भारतेन्दु हरिश्चंद्र)
async function ingestNatakAurRangmanch() {
  console.log('[BATCH-20] 5/5 Fetching नाटक और रंगमंच (भारतेन्दु हरिश्चंद्र)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('भारतेंदु-नाटकावली/भूमिका/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const subA = a.replace(/^भारतेंदु-नाटकावली\/भूमिका\//, '').trim();
    const subB = b.replace(/^भारतेंदु-नाटकावली\/भूमिका\//, '').trim();
    const mA = subA.match(/^([०-९]+)/);
    const mB = subB.match(/^([०-९]+)/);
    const nA = mA ? devanagariToNumber(mA[1]) : 999;
    const nB = mB ? devanagariToNumber(mB[1]) : 999;
    return nA - nB;
  });

  let mdContent = `---
id: "natak-aur-rangmanch"
title: "नाटक और रंगमंच (नाटकावली विमर्श)"
title_en: "Natak Aur Rangmanch (Dramatic Criticism)"
author: "भारतेन्दु हरिश्चंद्र"
author_en: "Bharatendu Harishchandra"
category: "निबंध व विमर्श"
category_en: "Literary Criticism / Dramatic Theory"
published_year: 1883
description: "आधुनिक हिन्दी नाट्य-साहित्य के जनक भारतेन्दु हरिश्चंद्र का भारतीय नाट्यशास्त्र, हिन्दी रंगमंच के इतिहास तथा अपने युगान्तकारी नाटकों—अंधेर नगरी, भारत दुर्दशा, नीलदेवी, सतीप्रताप आदि की समीक्षा पर आधारित १२ अध्यायों का कालजयी विमर्श।"
keywords: ["natak aur rangmanch", "bharatendu harishchandra", "natyashastra", "hindi drama history", "literary criticism"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^भारतेंदु-नाटकावली\/भूमिका\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch20Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-20] Ingested Natak Aur Rangmanch chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-20] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'natak-aur-rangmanch.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-20] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'natak-aur-rangmanch',
    title_hi: 'नाटक और रंगमंच (नाटकावली विमर्श)',
    title_en: 'Natak Aur Rangmanch (Dramatic Criticism)',
    author_hi: 'भारतेन्दु हरिश्चंद्र',
    author_en: 'Bharatendu Harishchandra',
    category_hi: 'निबंध व विमर्श',
    category_en: 'Literary Criticism / Dramatic Theory',
    published_year: 1883,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भारतेंदु-नाटकावली/भूमिका',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: 'भारतेन्दु हरिश्चंद्र (१८५०–१८८५) का भारतीय नाट्यशास्त्र, नाटक के इतिहास व अपने प्रमुख नाटकों की आलोचना पर आधारित १२ अध्यायों का शास्त्रीय विमर्श।'
  });
}

async function runBatch20() {
  console.log('=== STARTING BATCH 20 INGESTION ===');
  await ingestDukhiBharat();
  await ingestTilismiMundari();
  await ingestYaqutiTakhti();
  await ingestSukhasharvari();
  await ingestNatakAurRangmanch();
  console.log('=== COMPLETED BATCH 20 INGESTION ===');
}

runBatch20().catch(console.error);
