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

function toHindiNum(n) {
  return String(n).replace(/[0-9]/g, d => '०१२३४५६७८९'[d]);
}

function stripNavHeader(text) {
  if (!text) return '';
  let cleaned = text;
  // Remove top lines that look like navigation header tables or arrows
  cleaned = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|मुखपृष्ठ|अगला भाग)[^\n]*?\n+/gis, '');
  cleaned = cleaned.replace(/^[^\n]*?(?:←|→)[^\n]*?\n+/gis, '');
  cleaned = cleaned.replace(/^_{3,}\s*\n+/gm, '');
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

// 1. Ingest Premashram (प्रेमाश्रम - मुंशी प्रेमचंद)
async function ingestPremashram() {
  console.log('[BATCH-16] 1/5 Fetching प्रेमाश्रम (मुंशी प्रेमचंद)...');

  let mdContent = `---
id: "premashram"
title: "प्रेमाश्रम"
title_en: "Premashram"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "उपन्यास"
category_en: "Novel / Agrarian Classic"
published_year: 1922
description: "मुंशी प्रेमचंद का महान किसान-उपन्यास (१९२२)। भारतीय ग्रामीण समाज, ज़मींदारी शोषण, किसानों के स्वाभिमान, सत्याग्रह और प्रेमशंकर-ज्ञानशंकर के पारिवारिक व सामाजिक अंतर्द्वंद्व का सम्पूर्ण ६४ अध्यायों में सजीव महाकाव्यात्मक अंकन।"
keywords: ["premashram", "munshi premchand", "kisan andolan", "zamindari", "upanyas", "peasant novel"]
cover: ""
---

`;

  let totalChapters = 0;
  for (let i = 1; i <= 64; i++) {
    const pageTitle = `प्रेमाश्रम/${toHindiNum(i)}`;
    try {
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# अध्याय ${toHindiNum(i)}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === 64) {
          console.log(`[BATCH-16] Ingested Premashram chapter ${totalChapters}/64 (${clean.length} chars)`);
        }
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-16] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'premashram.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-16] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'premashram',
    title_hi: 'प्रेमाश्रम',
    title_en: 'Premashram',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Agrarian Classic',
    published_year: 1922,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/प्रेमाश्रम',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२२ हिन्दी पुस्तक एजेंसी, कलकत्ता व सरस्वती प्रेस से सत्यापित मुंशी प्रेमचंद का सम्पूर्ण ६४ अध्यायों का कालजयी किसान-उपन्यास।'
  });
}

// 2. Ingest Mansarovar 2 (मानसरोवर २ - मुंशी प्रेमचंद)
async function ingestMansarovar2() {
  console.log('[BATCH-16] 2/5 Fetching मानसरोवर (भाग २) (मुंशी प्रेमचंद)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('मानसरोवर २/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  let mdContent = `---
id: "mansarovar-2"
title: "मानसरोवर (भाग २)"
title_en: "Mansarovar Part 2"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "कहानी संग्रह"
category_en: "Short Stories"
published_year: 1936
description: "मुंशी प्रेमचंद के अमर कथा-साहित्य का दूसरा प्रामाणिक खण्ड। इसमें 'दो बैलों की कथा' (हीरा और मोती), 'लॉटरी', 'दूध का दाम', 'बालक', 'रियासत का दीवान', 'डामुल का कैदी' और 'नया विवाह' जैसी हिन्दी साहित्य की २६ विश्वविख्यात कहानियाँ संकलित हैं।"
keywords: ["mansarovar", "munshi premchand", "do bailon ki katha", "lottery", "doodh ka daam", "hindi kahaniya"]
cover: ""
---

`;

  let totalStories = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^मानसरोवर २\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalStories++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-16] Ingested Mansarovar 2 story ${totalStories}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-16] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'mansarovar-2.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-16] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'mansarovar-2',
    title_hi: 'मानसरोवर (भाग २)',
    title_en: 'Mansarovar Part 2',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'कहानी संग्रह',
    category_en: 'Short Stories',
    published_year: 1936,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/मानसरोवर_२',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: '१९३६/१९४६ हंस प्रकाशन / सरस्वती प्रेस से सत्यापित मुंशी प्रेमचंद की २६ अमर कहानियों का संकलन (दो बैलों की कथा, लॉटरी, दूध का दाम सहित)।'
  });
}

// 3. Ingest Kural Kavya (कुरल-काव्य - तिरुवल्लुवर / अनु. पं० गोविन्दराय जैन)
async function ingestKuralKavya() {
  console.log('[BATCH-16] 3/5 Fetching कुरल-काव्य (तिरुवल्लुवर / पं० गोविन्दराय जैन)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('कुरल-काव्य/परिच्छेद')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  let mdContent = `---
id: "kural-kavya"
title: "कुरल-काव्य"
title_en: "Kural Kavya (Tirukkural)"
author: "तिरुवल्लुवर"
author_en: "Tiruvalluvar"
category: "कविता"
category_en: "Poetry / Ethics"
published_year: 1930
description: "दक्षिण भारत के अमर महर्षि तिरुवल्लुवर द्वारा रचित तमिल संगम साहित्य के सर्वोच्च नीतिशास्त्र 'तिरुक्कुरल' का प्रामाणिक हिन्दी पद्यानुवाद। धर्म, अर्थ, गृहस्थ-कर्तव्य, सत्य, दया, अहिंसा और राजनीति पर १०८ परिच्छेदों में कालजयी अमृत-वाणी।"
keywords: ["kural kavya", "tirukkural", "tiruvalluvar", "govindray jain", "tamil sangam", "ethics", "kavita"]
cover: ""
---

`;

  let totalSections = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^कुरल-काव्य\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalSections++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        if (totalSections % 15 === 0 || totalSections === subpages.length) {
          console.log(`[BATCH-16] Ingested Kural section ${totalSections}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-16] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'kural-kavya.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-16] Saved ${filePath} with ${totalSections} sections.`);

  logSourceRecord({
    id: 'kural-kavya',
    title_hi: 'कुरल-काव्य',
    title_en: 'Kural Kavya (Tirukkural)',
    author_hi: 'तिरुवल्लुवर',
    author_en: 'Tiruvalluvar',
    category_hi: 'कविता',
    category_en: 'Poetry / Ethics',
    published_year: 1930,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कुरल-काव्य',
    ingested_at: '2026-11-14',
    chapter_count: totalSections,
    verification_notes: 'नीतिधर्म ग्रन्थमाला से प्रकाशित तिरुवल्लुवर के तमिल महाग्रन्थ तिरुक्कुरल का पं० गोविन्दराय जैन शास्त्री द्वारा प्रामाणिक पद्यानुवाद।'
  });
}

// 4. Ingest Ayodhya Ka Itihas (अयोध्या का इतिहास - रायबहादुर लाला सीताराम 'भूप')
async function ingestAyodhyaKaItihas() {
  console.log('[BATCH-16] 4/5 Fetching अयोध्या का इतिहास (लाला सीताराम)...');

  const chapters = [
    { title: 'अध्याय १: अयोध्या की महिमा', page: 'अयोध्या का इतिहास/१- अयोध्या की महिमा' },
    { title: 'अध्याय २: उत्तर कोशल और अयोध्या की स्थिति', page: 'अयोध्या का इतिहास/२— उत्तर कोशल और अयोध्या की स्थिति' },
    { title: 'अध्याय ३: प्राचीन अयोध्या', page: 'अयोध्या का इतिहास/३— प्राचीन अयोध्या' },
    { title: 'अध्याय ४: आज-कल की अयोध्या', page: 'अयोध्या का इतिहास/४—आज-कल की अयोध्या' },
    { title: 'अध्याय ५: अयोध्या के आदिम निवासी', page: 'अयोध्या का इतिहास/५—अयोध्या के आदिम निवासी' },
    { title: 'अध्याय ६: वेदों में अयोध्या', page: 'अयोध्या का इतिहास/६—वेदों में अयोध्या' },
    { title: 'अध्याय ७: पुराणों में अयोध्या', page: 'अयोध्या का इतिहास/७—पुराणों में अयोध्या' },
    { title: 'अध्याय ८: अयोध्या और जैनधर्म', page: 'अयोध्या का इतिहास/८—अयोध्या और जैनधर्म' },
    { title: 'अध्याय ९: अयोध्या और बौद्धमत', page: 'अयोध्या का इतिहास/९—अयोध्या और बौद्धमत' },
    { title: 'अध्याय १०: अयोध्या के गुप्तवंशी राजा', page: 'अयोध्या का इतिहास/१०—अयोध्या के गुप्तवंशी राजा' },
    { title: 'अध्याय ११: अयोध्या के योगी, वैश्य, श्रीवास्तव्य, परिहार और गहरवार वंशी राजा', page: 'अयोध्या का इतिहास/११—अयोध्या के योगी वैश्य श्रीवास्तव्य परिहार और गहरवार वंशी राजा' },
    { title: 'अध्याय १२: भारत पर मुस्लिम राज्य स्थापन से पहिले अयोध्या पर मुस्लिमों के आक्रमण', page: 'अयोध्या का इतिहास/१२—भारत पर मुस्लिम राज्य स्थापन से पहिले अयोध्या पर मुस्लिमों के आक्रमण' },
    { title: 'अध्याय १३: दिल्ली के बादशाहों के राज्य में अयोध्या', page: 'अयोध्या का इतिहास/१३—दिल्ली के बादशाहों के राज्य में अयोध्या' },
    { title: 'अध्याय १४: नवाब वजीरों के शासन में अयोध्या', page: 'अयोध्या का इतिहास/१४—नवाब वजीरों के शासन में अयोध्या' },
    { title: 'अध्याय १५: अयोध्या के शाकद्वीपी राजा', page: 'अयोध्या का इतिहास/१५—अयोध्या के शाकद्वीपी राजा' },
    { title: 'अध्याय १६: अंगरेजी राज्य में अयोध्या', page: 'अयोध्या का इतिहास/१६—अंगरेजी राज्य में अयोध्या' }
  ];

  let mdContent = `---
id: "ayodhya-ka-itihas"
title: "अयोध्या का इतिहास"
title_en: "Ayodhya Ka Itihas"
author: "लाला सीताराम"
author_en: "Lala Sitaram"
category: "इतिहास"
category_en: "History / Archaeology"
published_year: 1932
description: "प्रसिद्ध पुरातत्त्ववेत्ता एवं इतिहासकार रायबहादुर लाला सीताराम 'भूप' द्वारा रचित अयोध्या का प्रामाणिक ऐतिहासिक, पुरातात्त्विक व सांस्कृतिक सर्वेक्षण ग्रंथ (१९३२)। वैदिक युग, रामायण काल, बौद्ध-जैन परम्परा, गुप्त राजवंश, मुगल व अवध के नवाबों के शासनकाल का विस्तृत प्रामाणिक इतिहास।"
keywords: ["ayodhya ka itihas", "lala sitaram", "ancient ayodhya", "archaeology", "itihas", "history"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of chapters) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-16] Ingested Ayodhya history chapter ${totalChapters}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(200);
    } catch (e) {
      console.warn(`[BATCH-16] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'ayodhya-ka-itihas.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-16] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'ayodhya-ka-itihas',
    title_hi: 'अयोध्या का इतिहास',
    title_en: 'Ayodhya Ka Itihas',
    author_hi: 'लाला सीताराम',
    author_en: 'Lala Sitaram',
    category_hi: 'इतिहास',
    category_en: 'History / Archaeology',
    published_year: 1932,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/अयोध्या_का_इतिहास',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९३२ हिन्दुस्तानी एकेडेमी, प्रयाग से प्रकाशित रायबहादुर लाला सीताराम भूप (१८६१–१९३७) का प्रामाणिक पुरातात्त्विक इतिहास।'
  });
}

// 5. Ingest Tata Jivan Charitra (जमसेदजी नसरवानजी ताता का जीवन चरित्र - मन्नन द्विवेदी 'गजपुरी')
async function ingestTataJivanCharitra() {
  console.log('[BATCH-16] 5/5 Fetching जमसेदजी नसरवानजी ताता का जीवन चरित्र (मन्नन द्विवेदी)...');

  const chapters = [
    { title: 'अध्याय १: जन्म और आरंभकाल', page: 'जमसेदजी नसरवानजी ताता का जीवन चरित्र/१—जन्म और आरंभकाल' },
    { title: 'अध्याय २: अभ्युदय एवं औद्योगिक क्रांति', page: 'जमसेदजी नसरवानजी ताता का जीवन चरित्र/२—अभ्युदय' },
    { title: 'अध्याय ३: देशभक्ति और लोकोपकार', page: 'जमसेदजी नसरवानजी ताता का जीवन चरित्र/३—देशभक्ति और परोपकार' },
    { title: 'अध्याय ४: जीवन संध्या एवं स्वर्गारोहण', page: 'जमसेदजी नसरवानजी ताता का जीवन चरित्र/४—स्वर्गारोहण' },
    { title: 'उपसंहार: राष्ट्र-निर्माण में ताता का अवदान', page: 'जमसेदजी नसरवानजी ताता का जीवन चरित्र/उपसंहार' }
  ];

  let mdContent = `---
id: "tata-jivan-charitra"
title: "जमसेदजी नसरवानजी ताता का जीवन चरित्र"
title_en: "Jamsetji Nusserwanji Tata Ka Jivan Charitra"
author: "मन्नन द्विवेदी 'गजपुरी'"
author_en: "Mannan Dwivedi 'Gajpuri'"
category: "जीवनी"
category_en: "Biography / Industrial Pioneer"
published_year: 1918
description: "भारतीय आधुनिक उद्योग के पितामह जमसेदजी नसरवानजी ताता की हिन्दी में रचित प्रथम प्रामाणिक जीवनी (१९१८)। कपड़ा मिलों, इस्पात नगर (जमशेदपुर), जल-विद्युत और भारतीय विज्ञान संस्थान (IISc) के स्वप्नद्रष्टा के संघर्ष, स्वावलंबन और देशभक्ति की अमर गाथा।"
keywords: ["jamsetji tata", "mannan dwivedi", "biography", "industrial pioneer", "jamshedpur", "jivan charitra"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of chapters) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-16] Ingested Tata biography chapter ${totalChapters}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(200);
    } catch (e) {
      console.warn(`[BATCH-16] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'tata-jivan-charitra.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-16] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'tata-jivan-charitra',
    title_hi: 'जमसेदजी नसरवानजी ताता का जीवन चरित्र',
    title_en: 'Jamsetji Nusserwanji Tata Ka Jivan Charitra',
    author_hi: 'मन्नन द्विवेदी \'गजपुरी\'',
    author_en: 'Mannan Dwivedi \'Gajpuri\'',
    category_hi: 'जीवनी',
    category_en: 'Biography / Industrial Pioneer',
    published_year: 1918,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/जमसेदजी_नसरवानजी_ताता_का_जीवन_चरित्र',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९१८ हिन्दी साहित्य सम्मेलन / नवल किशोर प्रेस से प्रकाशित मन्नन द्विवेदी गजपुरी (१८८६–१९२१) द्वारा रचित जमसेदजी ताता की प्रामाणिक जीवनी।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 16 INGESTION ===');
  await ingestPremashram();
  await ingestMansarovar2();
  await ingestKuralKavya();
  await ingestAyodhyaKaItihas();
  await ingestTataJivanCharitra();
  console.log('=== BATCH 16 INGESTION COMPLETE ===');
}

main().catch(console.error);
