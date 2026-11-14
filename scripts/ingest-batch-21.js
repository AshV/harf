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

function cleanBatch21Text(text) {
  if (!text) return '';
  let cleaned = text;

  // Remove multi-line navigation headers at start
  while (true) {
    const next = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|पीछे|मुखपृष्ठ|मुख्यपृष्ठ|अगला भाग|अगला अध्याय|पिछला अध्याय|\(\d{4}\)|\(१९२६\)|रघुवंश|अप्सरा|भारतवर्ष का इतिहास|रहीम-कवितावली|हीराबाई)[^\n]*?\n+/i, '');
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

// 1. Ingest Raghuvansh (रघुवंश - आचार्य महावीर प्रसाद द्विवेदी)
async function ingestRaghuvansh() {
  console.log('[BATCH-21] 1/5 Fetching रघुवंश (महावीर प्रसाद द्विवेदी)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('रघुवंश/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  function getRaghuvanshWeight(t) {
    const sub = t.replace(/^रघुवंश\//, '').trim();
    if (sub.includes('भूमिका')) {
      if (sub.includes('निवेदन')) return 1;
      if (sub.includes('समय')) return 2;
      if (sub.includes('कविता')) return 3;
      if (sub.includes('ग्रन्थ')) return 4;
      if (sub.includes('शास्त्र-ज्ञान')) return 5;
      return 0;
    }
    const m = sub.match(/^([०-९]+)/);
    return m ? 10 + devanagariToNumber(m[1]) : 50;
  }

  subpages.sort((a, b) => getRaghuvanshWeight(a) - getRaghuvanshWeight(b));

  let mdContent = `---
id: "raghuvansh"
title: "रघुवंश"
title_en: "Raghuvansh"
author: "महावीर प्रसाद द्विवेदी"
author_en: "Mahavir Prasad Dwivedi"
category: "कविता"
category_en: "Classical Epic & Literary Translation"
published_year: 1912
description: "महाकवि कालिदास रचित महाकाव्य 'रघुवंश' का आचार्य महावीर प्रसाद द्विवेदी द्वारा किया गया प्रामाणिक गद्यानुवाद एवं विस्तृत साहित्यिक विमर्श। सूर्यवंश के प्रतापी राजाओं—दिलीप, रघु, अज, दशरथ, श्रीराम, कुश और उनके उत्तरवर्ती राजाओं के यश और आदर्शों का सम्पूर्ण १९ सर्गों व ५ भूमिका-खंडों में सांगोपांग आख्यान।"
keywords: ["raghuvansh", "kalidasa", "mahavir prasad dwivedi", "sanskrit classic", "suryavansh", "epic poetry", "classical hindi"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^रघुवंश\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch21Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 6 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-21] Ingested Raghuvansh chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-21] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'raghuvansh.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-21] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'raghuvansh',
    title_hi: 'रघुवंश',
    title_en: 'Raghuvansh',
    author_hi: 'महावीर प्रसाद द्विवेदी',
    author_en: 'Mahavir Prasad Dwivedi',
    category_hi: 'कविता',
    category_en: 'Classical Epic & Literary Translation',
    published_year: 1912,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/रघुवंश',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९१२ (इंडियन प्रेस, प्रयाग) से प्रकाशित आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा महाकवि कालिदास के रघुवंश का सम्पूर्ण १९ सर्गों व भूमिका सहित प्रामाणिक अनुवाद।'
  });
}

// 2. Ingest Rahim-Kavitavali (रहीम-कवितावली - कविवर रहीम)
async function ingestRahimKavitavali() {
  console.log('[BATCH-21] 2/5 Fetching रहीम-कवितावली (कविवर रहीम)...');

  const canonicalOrder = [
    'रहीम-कवितावली/रहीम का परिचय',
    'रहीम-कवितावली/दोहे',
    'रहीम-कवितावली/सोरठे',
    'रहीम-कवितावली/बरवै नायिका भेद',
    'रहीम-कवितावली/ख़ानख़ाना-कृत बरवै',
    'रहीम-कवितावली/मदनाष्टक',
    'रहीम-कवितावली/नगर-शोभा-वर्णन',
    'रहीम-कवितावली/खेट-कौतुक',
    'रहीम-कवितावली/रहीम के स्फुट हिन्दी-छन्द',
    'रहीम-कवितावली/रहीम के स्फुट संस्कृत-छन्द'
  ];

  let mdContent = `---
id: "rahim-kavitavali"
title: "रहीम-कवितावली"
title_en: "Rahim-Kavitavali"
author: "कविवर रहीम"
author_en: "Rahim"
category: "कविता"
category_en: "Classical Devotional & Aesthetic Poetry"
published_year: 1926
description: "अब्दुर्रहीम ख़ान-ए-ख़ानाँ 'रहीम' (१५५६–१६२७) का प्रामाणिक समग्र काव्य-संग्रह। सुरेन्द्रनाथ तिवारी द्वारा सम्पादित इस संकलन में दोहे और सोरठों के अतिरिक्त बरवै नायिका भेद, मदनाष्टक, नगर-शोभा, खेट-कौतुक (ज्योतिष काव्य) तथा स्फुट हिन्दी व संस्कृत छन्दों का सम्पूर्ण १० खंडों में दुर्लभ समाहार।"
keywords: ["rahim kavitavali", "rahim", "barvai nayika bhed", "madanastak", "nagar shobha", "khet kautuk", "braj bhasha", "riti poetry"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of canonicalOrder) {
    try {
      const cleanTitle = pageTitle.replace(/^रहीम-कवितावली\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch21Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-21] Ingested Rahim-Kavitavali section ${totalChapters}/${canonicalOrder.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-21] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'rahim-kavitavali.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-21] Saved ${filePath} with ${totalChapters} sections.`);

  logSourceRecord({
    id: 'rahim-kavitavali',
    title_hi: 'रहीम-कवितावली',
    title_en: 'Rahim-Kavitavali',
    author_hi: 'कविवर रहीम',
    author_en: 'Rahim',
    category_hi: 'कविता',
    category_en: 'Classical Devotional & Aesthetic Poetry',
    published_year: 1926,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/रहीम-कवितावली',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२६ (काशी) से प्रकाशित कविवर अब्दुर्रहीम ख़ान-ए-ख़ानाँ (१५५६–१६२७) का सुरेन्द्रनाथ तिवारी द्वारा सम्पादित सम्पूर्ण १० खंडों का काव्य-संग्रह।'
  });
}

// 3. Ingest Apsara (अप्सरा - सूर्यकांत त्रिपाठी 'निराला')
async function ingestApsara() {
  console.log('[BATCH-21] 3/5 Fetching अप्सरा (सूर्यकांत त्रिपाठी निराला)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('अप्सरा/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  function getApsaraWeight(t) {
    const sub = t.replace(/^अप्सरा\//, '').trim();
    if (sub === 'अगला भाग') return 0;
    const m = sub.match(/([०-९\d]+)$/);
    return m ? Number(m[1]) : 99;
  }

  subpages.sort((a, b) => getApsaraWeight(a) - getApsaraWeight(b));

  let mdContent = `---
id: "apsara"
title: "अप्सरा"
title_en: "Apsara"
author: "सूर्यकांत त्रिपाठी 'निराला'"
author_en: "Suryakant Tripathi 'Nirala'"
category: "उपन्यास"
category_en: "Novel / Social Realism"
published_year: 1931
description: "महाप्राण सूर्यकान्त त्रिपाठी 'निराला' द्वारा रचित प्रसिद्ध सामाजिक उपन्यास। कनक और अप्सरा के माध्यम से तत्कालीन सामंती समाज की संकीर्णताओं, वेश्यावृत्ति के अभिशाप, स्त्री-अधिकारों और मानवतावादी प्रेम का १० अध्यायों में फैला अत्यंत भावुक व यथार्थपरक चित्रण।"
keywords: ["apsara", "suryakant tripathi nirala", "nirala", "social novel", "hindi novel", "realism"]
cover: ""
---

`;

  let totalChapters = 0;
  for (let i = 0; i < subpages.length; i++) {
    const pageTitle = subpages[i];
    try {
      const cleanTitle = i === 0 ? 'प्रारम्भिक भाग' : `भाग ${i}`;
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch21Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-21] Ingested Apsara chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-21] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'apsara.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-21] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'apsara',
    title_hi: 'अप्सरा',
    title_en: 'Apsara',
    author_hi: "सूर्यकांत त्रिपाठी 'निराला'",
    author_en: "Suryakant Tripathi 'Nirala'",
    category_hi: 'उपन्यास',
    category_en: 'Novel / Social Realism',
    published_year: 1931,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/अप्सरा',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: "१९३१ में प्रकाशित महाप्राण सूर्यकांत त्रिपाठी 'निराला' (१८९९–१९६१) का सम्पूर्ण १० अध्यायों का कालजयी सामाजिक उपन्यास।"
  });
}

// 4. Ingest Bharatvarsh Ka Itihas (भारतवर्ष का इतिहास - लाला सीताराम 'भूप' व ई॰ मार्सडेन)
async function ingestBharatvarshKaItihas() {
  console.log('[BATCH-21] 4/5 Fetching भारतवर्ष का इतिहास (लाला सीताराम भूप)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('भारतवर्ष का इतिहास/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title).filter(t => !t.includes('किताबों की फहरिस्त'));

  function getBvhWeight(t) {
    const sub = t.replace(/^भारतवर्ष का इतिहास\//, '').trim();
    const m = sub.match(/^([०-९]+)/);
    return m ? devanagariToNumber(m[1]) : 999;
  }

  subpages.sort((a, b) => getBvhWeight(a) - getBvhWeight(b));

  let mdContent = `---
id: "bharatvarsh-ka-itihas"
title: "भारतवर्ष का इतिहास"
title_en: "Bharatvarsh Ka Itihas"
author: "लाला सीताराम 'भूप'"
author_en: "Lala Sitaram 'Bhup'"
category: "इतिहास व संस्कृति"
category_en: "History & Civilisation"
published_year: 1919
description: "लाला सीताराम 'भूप' एवं ई॰ मार्सडेन द्वारा रचित भारतवर्ष का वृहत् प्रामाणिक इतिहास। प्राचीन वैदिक काल, रामायण व महाभारत काल, बुद्ध व महावीर का युग, मौर्य व गुप्त साम्राज्य, राजपूत काल, दिल्ली सल्तनत, मुग़ल काल और मराठा उत्कर्ष तक का सम्पूर्ण ४५ अध्यायों में विस्तृत व रोचक ऐतिहासिक अध्ययन।"
keywords: ["bharatvarsh ka itihas", "lala sitaram bhup", "indian history", "vedic period", "buddhism", "mughal empire", "maratha"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^भारतवर्ष का इतिहास\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch21Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-21] Ingested Bharatvarsh Ka Itihas chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-21] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'bharatvarsh-ka-itihas.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-21] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'bharatvarsh-ka-itihas',
    title_hi: 'भारतवर्ष का इतिहास',
    title_en: 'Bharatvarsh Ka Itihas',
    author_hi: "लाला सीताराम 'भूप'",
    author_en: "Lala Sitaram 'Bhup'",
    category_hi: 'इतिहास व संस्कृति',
    category_en: 'History & Civilisation',
    published_year: 1919,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भारतवर्ष_का_इतिहास',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: "१९१९ मैकमिलन एंड कंपनी लिमिटेड (कलकत्ता, बम्बई, लंदन) से प्रकाशित लाला सीताराम 'भूप' (१८६१–१९३७) व ई॰ मार्सडेन का सम्पूर्ण ४५ अध्यायों का प्रामाणिक इतिहास-ग्रन्थ।"
  });
}

// 5. Ingest Heera-Bai (हीराबाई - पं. किशोरीलाल गोस्वामी)
async function ingestHeeraBai() {
  console.log('[BATCH-21] 5/5 Fetching हीराबाई (पं. किशोरीलाल गोस्वामी)...');

  const subpages = [
    'हीराबाई/ भाग 1',
    'हीराबाई/ भाग 2'
  ];

  let mdContent = `---
id: "heera-bai"
title: "हीराबाई"
title_en: "Heera-Bai"
author: "पं. किशोरीलाल गोस्वामी"
author_en: "Pt. Kishorilal Goswami"
category: "उपन्यास"
category_en: "Novel / Historical Romance"
published_year: 1905
description: "पं. किशोरीलाल गोस्वामी द्वारा रचित ऐतिहासिक-रोमांचक उपन्यास। अलाउद्दीन खिलजी के काल की ऐतिहासिक पृष्ठभूमि, वीरता, छल, नारी-सम्मान और शौर्य की अमर कथा।"
keywords: ["heera bai", "kishorilal goswami", "historical novel", "alauddin khilji", "early hindi novel"]
cover: ""
---

`;

  let totalChapters = 0;
  for (let i = 0; i < subpages.length; i++) {
    const pageTitle = subpages[i];
    try {
      const cleanTitle = `भाग ${i + 1}`;
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch21Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-21] Ingested Heera-Bai part ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-21] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'heera-bai.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-21] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'heera-bai',
    title_hi: 'हीराबाई',
    title_en: 'Heera-Bai',
    author_hi: 'पं. किशोरीलाल गोस्वामी',
    author_en: 'Pt. Kishorilal Goswami',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Historical Romance',
    published_year: 1905,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/हीराबाई',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९०५ सुदर्शन प्रेस, वृन्दावन से प्रकाशित पं. किशोरीलाल गोस्वामी (१८६५–१९३२) का ऐतिहासिक उपन्यास हीराबाई।'
  });
}

async function runBatch21() {
  console.log('=== STARTING BATCH 21 INGESTION ===');
  await ingestRaghuvansh();
  await ingestRahimKavitavali();
  await ingestApsara();
  await ingestBharatvarshKaItihas();
  await ingestHeeraBai();
  console.log('=== COMPLETED BATCH 21 INGESTION ===');
}

runBatch21().catch(console.error);
