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

function cleanBatch23Text(text) {
  if (!text) return '';
  let cleaned = text;

  // Remove multi-line navigation headers at start
  while (true) {
    const next = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|पीछे|मुखपृष्ठ|मुख्यपृष्ठ|भूमिका|मङ्गलाचरण|अगला भाग|अगला अध्याय|पिछला अध्याय|\(\d{4}\)|हिंदी व्याकरण|भाव-विलास|नैषध-चरित-चर्चा|हिंदी निबंधमाला|ऊषा-अनिरुद्ध)[^\n]*?\n+/i, '');
    if (next === cleaned) break;
    cleaned = next;
  }

  // Remove repeated hyphens or underscores
  cleaned = cleaned.replace(/^[_\-–—\s]{3,}\n+/gm, '');
  cleaned = cleaned.replace(/(?:^[\s\-–—_]{1,3}\n+){2,}/gm, '');

  // Remove copyright / public domain disclaimers at end
  cleaned = cleaned.replace(/(?:पर सभी दस्तावेज सार्वजनिक प्रभावक्षेत्र|यह कार्य\s+भारत में\s+सार्वजनिक डोमेन|सार्वजनिक प्रभावक्षेत्र में आया था|कॉपीराइट पंजीकरण नहीं है|Public domain)[\s\S]*$/gi, '');

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
  const digits = str.replace(/[^\u0966-\u096F\d]/g, '');
  if (!digits) return 999;
  return Number(digits.replace(/[\u0966-\u096F]/g, d => map[d] !== undefined ? map[d] : d));
}

// 1. Ingest Hindi Vyakaran (हिंदी व्याकरण - पं. कामताप्रसाद गुरु)
async function ingestHindiVyakaran() {
  console.log('[BATCH-23] 1/5 Fetching हिंदी व्याकरण (पं. कामताप्रसाद गुरु)...');

  const canonicalOrder = [
    { page: 'हिंदी व्याकरण/प्रस्तावना', title: 'प्रस्तावना' },
    { page: 'हिंदी व्याकरण/हिंदी की उत्पत्ति', title: 'हिंदी की उत्पत्ति' },
    { page: 'हिंदी व्याकरण/वर्ण विचार', title: 'वर्ण विचार' },
    { page: 'हिंदी व्याकरण/शब्द-भेद', title: 'शब्द-भेद' },
    { page: 'हिंदी व्याकरण/संज्ञा', title: 'संज्ञा' },
    { page: 'हिंदी व्याकरण/सर्वनाम', title: 'सर्वनाम' },
    { page: 'हिंदी व्याकरण/विशेषण', title: 'विशेषण' },
    { page: 'हिंदी व्याकरण/क्रिया', title: 'क्रिया' },
    { page: 'हिंदी व्याकरण/क्रिया-विशेषण', title: 'क्रिया-विशेषण' },
    { page: 'हिंदी व्याकरण/संबंध-सूचक', title: 'संबंध-सूचक' },
    { page: 'हिंदी व्याकरण/समुच्चय-बोधक', title: 'समुच्चय-बोधक' },
    { page: 'हिंदी व्याकरण/विस्मयादि-बोधक', title: 'विस्मयादि-बोधक' }
  ];

  let mdContent = `---
id: "hindi-vyakaran"
title: "हिंदी व्याकरण"
title_en: "Hindi Vyakaran"
author: "पं. कामताप्रसाद गुरु"
author_en: "Pt. Kamtaprasad Guru"
category: "भाषा व व्याकरण"
category_en: "Linguistics & Standard Grammar"
published_year: 1920
description: "नागरी प्रचारिणी सभा, काशी द्वारा प्रकाशित हिन्दी भाषा और व्याकरण का सर्वमान्य, मानक एवं सर्वाधिक प्रामाणिक महाग्रंथ। हिन्दी की ऐतिहासिक उत्पत्ति, वर्ण-विचार, शब्द-भेद, संज्ञा, सर्वनाम, विशेषण, क्रिया और अव्ययों का १२ अध्यायों में सांगोपांग शास्त्रीय विवेचन।"
keywords: ["hindi vyakaran", "kamtaprasad guru", "nagari pracharini sabha", "hindi grammar", "linguistics", "standard hindi"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of canonicalOrder) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch23Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-23] Ingested Hindi Vyakaran chapter ${totalChapters}/${canonicalOrder.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-23] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'hindi-vyakaran.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-23] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'hindi-vyakaran',
    title_hi: 'हिंदी व्याकरण',
    title_en: 'Hindi Vyakaran',
    author_hi: 'पं. कामताप्रसाद गुरु',
    author_en: 'Pt. Kamtaprasad Guru',
    category_hi: 'भाषा व व्याकरण',
    category_en: 'Linguistics & Standard Grammar',
    published_year: 1920,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/हिंदी_व्याकरण',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२० नागरी प्रचारिणी सभा, काशी से प्रकाशित पं. कामताप्रसाद गुरु (१८७५–१९२७) का सर्वमान्य मानक व्याकरण ग्रंथ।'
  });
}

// 2. Ingest Bhav-Vilas (भाव-विलास - महाकवि देव)
async function ingestBhavVilas() {
  console.log('[BATCH-23] 2/5 Fetching भाव-विलास (महाकवि देव)...');

  const canonicalOrder = [
    { page: 'भाव-विलास/प्रथम विलास/ग्रन्थ-परिचय', title: 'ग्रन्थ-परिचय व वंदना' },
    { page: 'भाव-विलास/प्रथम विलास/१ स्थायी भाव', title: 'प्रथम विलास: स्थायी भाव' },
    { page: 'भाव-विलास/प्रथम विलास/२ विभाव', title: 'प्रथम विलास: विभाव' },
    { page: 'भाव-विलास/प्रथम विलास/३ अनुभाव', title: 'प्रथम विलास: अनुभाव' },
    { page: 'भाव-विलास/द्वितीय विलास/सात्विक भाव', title: 'द्वितीय विलास: सात्विक भाव' },
    { page: 'भाव-विलास/द्वितीय विलास/संचारी भाव', title: 'द्वितीय विलास: संचारी भाव' },
    { page: 'भाव-विलास/तृतीय विलास/हाव', title: 'तृतीय विलास: हाव' },
    { page: 'भाव-विलास/तृतीय विलास/रस', title: 'तृतीय विलास: रस' },
    { page: 'भाव-विलास/चतुर्थ विलास/नायिका वर्णन', title: 'चतुर्थ विलास: नायिका वर्णन' },
    { page: 'भाव-विलास/चतुर्थ विलास/नायक विचार', title: 'चतुर्थ विलास: नायक विचार' },
    { page: 'भाव-विलास/चतुर्थ विलास/सखी-भेद', title: 'चतुर्थ विलास: सखी-भेद' },
    { page: 'भाव-विलास/पञ्चम विलास/अलंकार', title: 'पञ्चम विलास: अलंकार' }
  ];

  let mdContent = `---
id: "bhav-vilas"
title: "भाव-विलास"
title_en: "Bhav-Vilas"
author: "महाकवि देव"
author_en: "Dev"
category: "कविता"
category_en: "Riti Poetics, Aesthetics & Classical Verse"
published_year: 1689
description: "रीतिकाल के शीर्ष आचार्य महाकवि देव (१६७३–१७६७) का रस, भाव, नायिका-भेद और काव्य-शास्त्र पर रचित अमर ग्रंथ। स्थायी भाव, विभाव, अनुभाव, सात्विक भाव, संचारी भाव, शृंगार-रस, हाव, नायक-नायिका भेद तथा अलंकारों का सम्पूर्ण ५ विलासों में गहन शास्त्रीय एवं काव्यात्मक निरूपण।"
keywords: ["bhav vilas", "mahakavi dev", "riti kavya", "braj bhasha", "rasa shastra", "nayika bhed", "alankara"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of canonicalOrder) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch23Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-23] Ingested Bhav-Vilas section ${totalChapters}/${canonicalOrder.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-23] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'bhav-vilas.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-23] Saved ${filePath} with ${totalChapters} sections.`);

  logSourceRecord({
    id: 'bhav-vilas',
    title_hi: 'भाव-विलास',
    title_en: 'Bhav-Vilas',
    author_hi: 'महाकवि देव',
    author_en: 'Dev',
    category_hi: 'कविता',
    category_en: 'Riti Poetics, Aesthetics & Classical Verse',
    published_year: 1689,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भाव-विलास',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: 'रीतिकाल के महाकवि देव (१६७३–१७६७) का सम्पूर्ण ५ विलासों व १२ अध्यायों का रस व काव्य-शास्त्रीय महाग्रंथ।'
  });
}

// 3. Ingest Naishadh-Charit-Charcha (नैषध-चरित-चर्चा - आचार्य महावीर प्रसाद द्विवेदी)
async function ingestNaishadhCharitCharcha() {
  console.log('[BATCH-23] 3/5 Fetching नैषध-चरित-चर्चा (आचार्य महावीर प्रसाद द्विवेदी)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('नैषध-चरित-चर्चा/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const subA = a.replace(/^नैषध-चरित-चर्चा\//, '').trim();
    const subB = b.replace(/^नैषध-चरित-चर्चा\//, '').trim();
    const mA = subA.match(/^([०-९\d]+)/);
    const mB = subB.match(/^([०-९\d]+)/);
    const nA = mA ? devanagariToNumber(mA[1]) : 999;
    const nB = mB ? devanagariToNumber(mB[1]) : 999;
    return nA - nB;
  });

  let mdContent = `---
id: "naishadh-charit-charcha"
title: "नैषध-चरित-चर्चा"
title_en: "Naishadh-Charit-Charcha"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "निबंध व विमर्श"
category_en: "Literary Criticism & Sanskrit Classics"
published_year: 1899
description: "आचार्य महावीर प्रसाद द्विवेदी द्वारा रचित संस्कृत महाकाव्य 'नैषधीयचरित' और महाकवि श्रीहर्ष का युगान्तकारी समालोचनात्मक अध्ययन। श्रीहर्ष का समय, काव्य-सौंदर्य, गर्वोक्तियाँ, कथानक तथा पद्यात्मक अनुवाद सहित सम्पूर्ण ११ अध्यायों में आधुनिक हिन्दी समालोचना का प्रथम मील का पत्थर।"
keywords: ["naishadh charit charcha", "mahavir prasad dwivedi", "sriharsha", "naishadhiyacharita", "literary criticism", "sanskrit classics"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^नैषध-चरित-चर्चा\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch23Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-23] Ingested Naishadh-Charit-Charcha chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-23] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'naishadh-charit-charcha.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-23] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'naishadh-charit-charcha',
    title_hi: 'नैषध-चरित-चर्चा',
    title_en: 'Naishadh-Charit-Charcha',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'निबंध व विमर्श',
    category_en: 'Literary Criticism & Sanskrit Classics',
    published_year: 1899,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/नैषध-चरित-चर्चा',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१८९९ (इंडियन प्रेस, प्रयाग) से प्रकाशित आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) का श्रीहर्ष और नैषध-चरित पर ११ अध्यायों का ऐतिहासिक समालोचना ग्रंथ।'
  });
}

// 4. Ingest Hindi Nibandhamala (हिंदी निबंधमाला - नागरी प्रचारिणी सभा)
async function ingestHindiNibandhamala() {
  console.log('[BATCH-23] 4/5 Fetching हिंदी निबंधमाला (नागरी प्रचारिणी सभा)...');

  const canonicalOrder = [
    { page: 'हिंदी निबंधमाला-१/बातचीत-श्रीयुत बालकृष्ण भट्ट', title: 'बातचीत — पं. बालकृष्ण भट्ट' },
    { page: 'हिंदी निबंधमाला-१/सच्ची वीरता-सर्दार पूर्णसिंह', title: 'सच्ची वीरता — सरदार पूर्णसिंह' },
    { page: 'हिंदी निबंधमाला-१/राजा भोज का सपना-राजा शिवप्रसाद', title: "राजा भोज का सपना — राजा शिवप्रसाद 'सितारेहिन्द'" },
    { page: 'हिंदी निबंधमाला-१/कवि और कविता-श्रीयुत महावीरप्रसाद द्विवेदी', title: 'कवि और कविता — आचार्य महावीर प्रसाद द्विवेदी' },
    { page: 'हिंदी निबंधमाला-१/समाज और साहित्य-श्रीयुत श्यामसुंदरदास', title: 'समाज और साहित्य — बाबू श्यामसुन्दर दास' },
    { page: 'हिंदी निबंधमाला-१/करुणा-श्रीयुत रामचंद्र शुक्ल', title: 'करुणा — आचार्य रामचंद्र शुक्ल' },
    { page: 'हिंदी निबंधमाला-१/क्रोध-श्रीयुत रामचंद्र शुक्ल', title: 'क्रोध — आचार्य रामचंद्र शुक्ल' },
    { page: 'हिंदी निबंधमाला-१/आपत्तियों का पर्वत-श्रीयुत केशवप्रसाद सिंह', title: 'आपत्तियों का पर्वत — राजा केशवप्रसाद सिंह' },
    { page: 'हिंदी निबंधमाला-१/रामलीला-श्रीयुत माधवप्रसाद मिश्र', title: 'रामलीला — पं. माधवप्रसाद मिश्र' },
    { page: 'हिंदी निबंधमाला-१/मित्र-लाभ-श्रीयुत गणपत जानकीराम दूबे', title: 'मित्र-लाभ — गणपत जानकीराम दूबे' },
    { page: 'हिंदी निबंधमाला-१/प्रकृति-सौंदर्य-श्रीयुत गणपत जानकीराम दूबे', title: 'प्रकृति-सौंदर्य — गणपत जानकीराम दूबे' },
    { page: 'हिंदी निबंधमाला-१/बुँदेलखंड-पर्य्यटन–श्रीयुत कृष्णबलदेव वर्म्मा', title: 'बुंदेलखंड-पर्यटन — कृष्णबलदेव वर्मा' }
  ];

  let mdContent = `---
id: "hindi-nibandhamala"
title: "हिंदी निबंधमाला"
title_en: "Hindi Nibandhamala"
author: "नागरी प्रचारिणी सभा"
author_en: "Nagari Pracharini Sabha"
category: "निबंध व विमर्श"
category_en: "Essays / Classical Hindi Prose Anthology"
published_year: 1920
description: "काशी नागरी प्रचारिणी सभा द्वारा प्रकाशित भारतेन्दु व द्विवेदी युग के मूर्धन्य विचारकों का ऐतिहासिक निबंध-संग्रह। बालकृष्ण भट्ट ('बातचीत'), सरदार पूर्णसिंह ('सच्ची वीरता'), राजा शिवप्रसाद सितारेहिन्द ('राजा भोज का सपना'), महावीर प्रसाद द्विवेदी, रामचंद्र शुक्ल, श्यामसुंदर दास, माधवप्रसाद मिश्र के १२ अमर गद्य-रत्न।"
keywords: ["hindi nibandhamala", "nagari pracharini sabha", "balkrishna bhatt", "puran singh", "ramchandra shukla", "classic essays", "hindi prose"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of canonicalOrder) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch23Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-23] Ingested Hindi Nibandhamala essay ${totalChapters}/${canonicalOrder.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-23] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'hindi-nibandhamala.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-23] Saved ${filePath} with ${totalChapters} essays.`);

  logSourceRecord({
    id: 'hindi-nibandhamala',
    title_hi: 'हिंदी निबंधमाला',
    title_en: 'Hindi Nibandhamala',
    author_hi: 'नागरी प्रचारिणी सभा',
    author_en: 'Nagari Pracharini Sabha',
    category_hi: 'निबंध व विमर्श',
    category_en: 'Essays / Classical Hindi Prose Anthology',
    published_year: 1920,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/हिंदी_निबंधमाला-१',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२० नागरी प्रचारिणी सभा, काशी द्वारा संकलित बालकृष्ण भट्ट, सरदार पूर्णसिंह, राजा शिवप्रसाद, रामचंद्र शुक्ल, श्यामसुंदर दास आदि के १२ अमर निबंध।'
  });
}

// 5. Ingest Usha-Aniruddha (ऊषा-अनिरुद्ध - पं. राधेश्याम कथावाचक)
async function ingestUshaAniruddha() {
  console.log('[BATCH-23] 5/5 Fetching ऊषा-अनिरुद्ध (पं. राधेश्याम कथावाचक)...');

  const subpages = [
    { page: 'ऊषा-अनिरुद्ध/भूमिका', title: 'भूमिका व निवेदन' },
    { page: 'ऊषा-अनिरुद्ध/मङ्गलाचरण', title: 'मंगलाचरण' },
    { page: 'ऊषा-अनिरुद्ध/अंक पहला', title: 'अंक पहला: कैलास व शोणितपुर' },
    { page: 'ऊषा-अनिरुद्ध/अंक दूसरा', title: 'अंक दूसरा: स्वप्न-दर्शन व चित्रलेखा' },
    { page: 'ऊषा-अनिरुद्ध/अंक तीसरा', title: 'अंक तीसरा: नागपाश व हरिहर युद्ध' }
  ];

  let mdContent = `---
id: "usha-aniruddha"
title: "ऊषा-अनिरुद्ध"
title_en: "Usha-Aniruddha"
author: "पं. राधेश्याम कथावाचक"
author_en: "Pt. Radheshyam Kathavachak"
category: "नाटक"
category_en: "Play / Classical Mythological Drama"
published_year: 1925
description: "पं. राधेश्याम कथावाचक (१८९०–१९६३) द्वारा रचित पौराणिक शास्त्रीय नाटक। बाणासुर की पुत्री ऊषा और श्रीकृष्ण के पौत्र अनिरुद्ध का अलौकिक प्रेम, चित्रलेखा की योग-माया, बाणासुर का अहंकार और ऐतिहासिक हरि-हर (शिव-कृष्ण) युद्ध का ५ भव्य अंकों व दृश्यों में जीवंत नाट्य-रूपांतरण।"
keywords: ["usha aniruddha", "radheshyam kathavachak", "mythological drama", "krishna", "banasur", "hindi natak"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of subpages) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch23Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-23] Ingested Usha-Aniruddha act ${totalChapters}/${subpages.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-23] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'usha-aniruddha.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-23] Saved ${filePath} with ${totalChapters} acts/sections.`);

  logSourceRecord({
    id: 'usha-aniruddha',
    title_hi: 'ऊषा-अनिरुद्ध',
    title_en: 'Usha-Aniruddha',
    author_hi: 'पं. राधेश्याम कथावाचक',
    author_en: 'Pt. Radheshyam Kathavachak',
    category_hi: 'नाटक',
    category_en: 'Play / Classical Mythological Drama',
    published_year: 1925,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/ऊषा-अनिरुद्ध',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२५ (बरेली) से प्रकाशित पं. राधेश्याम कथावाचक (१८९०–१९६३) का सम्पूर्ण ५ खंडों व अंकों का सुप्रसिद्ध पौराणिक नाटक।'
  });
}

async function runBatch23() {
  console.log('=== STARTING BATCH 23 INGESTION ===');
  await ingestHindiVyakaran();
  await ingestBhavVilas();
  await ingestNaishadhCharitCharcha();
  await ingestHindiNibandhamala();
  await ingestUshaAniruddha();
  console.log('=== COMPLETED BATCH 23 INGESTION ===');
}

runBatch23().catch(console.error);
