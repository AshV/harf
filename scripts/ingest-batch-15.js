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

function stripNavHeader(text) {
  if (!text) return '';
  let cleaned = text;
  // Remove top lines that look like navigation header tables or arrows
  cleaned = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|मुखपृष्ठ)[^\n]*?\n+/gis, '');
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

// 1. Ingest Hindi Sahitya Ka Itihas (हिंदी साहित्य का इतिहास - आचार्य रामचंद्र शुक्ल)
async function ingestHindiSahityaKaItihas() {
  console.log('[BATCH-15] 1/5 Fetching हिंदी साहित्य का इतिहास (आचार्य रामचंद्र शुक्ल)...');

  const sections = [
    { title: 'काल-विभाग एवं भूमिका', page: 'हिंदी साहित्य का इतिहास/काल-विभाग' },
    { title: 'आदिकाल (प्रकरण १: सामान्य परिचय)', page: 'हिंदी साहित्य का इतिहास/आदिकाल/प्रकरण १ सामान्य परिचय' },
    { title: 'आदिकाल (प्रकरण २: अपभ्रंश-काल)', page: 'हिंदी साहित्य का इतिहास/आदिकाल/प्रकरण २ अपभ्रंश-काल' },
    { title: 'आदिकाल (प्रकरण ३: देशभाषा काव्य - वीरगाथा)', page: 'हिंदी साहित्य का इतिहास/आदिकाल/प्रकरण ३ देशभाषा काव्य (वीरगाथा)' },
    { title: 'आदिकाल (प्रकरण ४: फुटकल रचनाएँ)', page: 'हिंदी साहित्य का इतिहास/आदिकाल/प्रकरण ४ फुटकल रचनाएँ' },
    { title: 'भक्तिकाल (प्रकरण १: सामान्य परिचय)', page: 'हिंदी साहित्य का इतिहास/भक्तिकाल/प्रकरण १ सामान्य परिचय' },
    { title: 'भक्तिकाल (प्रकरण २: निर्गुण धारा - ज्ञानाश्रयी शाखा)', page: 'हिंदी साहित्य का इतिहास/भक्तिकाल/प्रकरण २ निर्गुण धारा/ज्ञानाश्रयी शाखा' },
    { title: 'भक्तिकाल (प्रकरण ३: निर्गुण धारा - प्रेममार्गी सूफी शाखा)', page: 'हिंदी साहित्य का इतिहास/भक्तिकाल/प्रकरण ३ निर्गुण धारा/प्रेममार्गी (सूफी) शाखा' },
    { title: 'भक्तिकाल (प्रकरण ४: सगुण धारा - रामभक्ति शाखा)', page: 'हिंदी साहित्य का इतिहास/भक्तिकाल/प्रकरण ४ सगुण धारा/रामभक्ति-शाखा' },
    { title: 'भक्तिकाल (प्रकरण ५: सगुण धारा - कृष्णभक्ति शाखा)', page: 'हिंदी साहित्य का इतिहास/भक्तिकाल/प्रकरण ५ सगुण धारा/कृष्णभक्ति शाखा' },
    { title: 'भक्तिकाल (प्रकरण ६: भक्तिकाल की फुटकल रचनाएँ)', page: 'हिंदी साहित्य का इतिहास/भक्तिकाल/प्रकरण ६ भक्तिकाल की फुटकल रचनाएँ' },
    { title: 'रीतिकाल (प्रकरण १: सामान्य परिचय)', page: 'हिंदी साहित्य का इतिहास/रीतिकाल/प्रकरण १ सामान्य परिचय' },
    { title: 'रीतिकाल (प्रकरण २: रीति-ग्रंथकार कवि)', page: 'हिंदी साहित्य का इतिहास/रीतिकाल/प्रकरण २ रीति-ग्रंथकार कवि' },
    { title: 'रीतिकाल (प्रकरण ३: रीतिकाल के अन्य कवि)', page: 'हिंदी साहित्य का इतिहास/रीतिकाल/प्रकरण ३ रीतिकाल के अन्य कवि' },
    { title: 'आधुनिक काल (गद्य खंड: प्रकरण १ गद्य का विकास)', page: 'हिंदी साहित्य का इतिहास/आधुनिक काल/गद्य खंड/प्रकरण १ गद्य का विकास' },
    { title: 'आधुनिक काल (गद्य खंड: प्रकरण २ गद्य-साहित्य का आविर्भाव)', page: 'हिंदी साहित्य का इतिहास/आधुनिक काल/गद्य खंड/प्रकरण २ गद्य-साहित्य का आविर्भाव' },
    { title: 'आधुनिक काल (गद्य खंड: प्रकरण ३ गद्य-साहित्य का प्रसार)', page: 'हिंदी साहित्य का इतिहास/आधुनिक काल/गद्य खंड/प्रकरण ३ गद्य-साहित्य का प्रसार' },
    { title: 'आधुनिक काल (काव्य खंड: प्रकरण १ पुरानी धारा)', page: 'हिंदी साहित्य का इतिहास/आधुनिक काल/काव्य खंड/प्रकरण १ पुरानी धारा' },
    { title: 'आधुनिक काल (काव्य खंड: प्रकरण २ नई धारा)', page: 'हिंदी साहित्य का इतिहास/आधुनिक काल/काव्य खंड/प्रकरण २ नई धारा' },
  ];

  let mdContent = `---
id: "hindi-sahitya-ka-itihas"
title: "हिंदी साहित्य का इतिहास"
title_en: "Hindi Sahitya Ka Itihas"
author: "आचार्य रामचंद्र शुक्ल"
author_en: "Acharya Ramchandra Shukla"
category: "निबन्ध"
category_en: "Literary History & Criticism"
published_year: 1929
description: "हिन्दी आलोचना और साहित्येतिहास का सर्वोच्च शिखर ग्रंथ। आचार्य रामचंद्र शुक्ल द्वारा रचित कालजयी इतिहास, जिसमें आदिकाल (वीरगाथा), भक्तिकाल, रीतिकाल और आधुनिक काल का वैज्ञानिक, युगचेतनामूलक व रसशास्त्रीय विश्लेषण समाहित है।"
keywords: ["hindi sahitya ka itihas", "ramchandra shukla", "aadikaal", "bhaktikaal", "ritikaal", "adhunik kaal", "criticism"]
cover: ""
---

`;

  let totalSections = 0;
  for (const item of sections) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalSections++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-15] Ingested Shukla Itihas section ${totalSections}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(200);
    } catch (e) {
      console.warn(`[BATCH-15] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'hindi-sahitya-ka-itihas.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-15] Saved ${filePath} with ${totalSections} sections.`);

  logSourceRecord({
    id: 'hindi-sahitya-ka-itihas',
    title_hi: 'हिंदी साहित्य का इतिहास',
    title_en: 'Hindi Sahitya Ka Itihas',
    author_hi: 'आचार्य रामचंद्र शुक्ल',
    author_en: 'Acharya Ramchandra Shukla',
    category_hi: 'निबन्ध',
    category_en: 'Literary History & Criticism',
    published_year: 1929,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/हिंदी_साहित्य_का_इतिहास',
    ingested_at: '2026-11-14',
    chapter_count: totalSections,
    verification_notes: '१९२९/१९४१ काशी नागरीप्रचारिणी सभा से प्रकाशित आचार्य रामचंद्र शुक्ल (१८८४–१९४१) का कालजयी साहित्येतिहास।'
  });
}

// 2. Ingest Premsagar (प्रेमसागर - लल्लू लाल)
async function ingestPremsagar() {
  console.log('[BATCH-15] 2/5 Fetching प्रेमसागर (लल्लू लाल)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('प्रेमसागर/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  let mdContent = `---
id: "premsagar"
title: "प्रेमसागर"
title_en: "Premsagar"
author: "लल्लू लाल"
author_en: "Lallu Lal"
category: "उपन्यास"
category_en: "Classic Narrative / Early Prose"
published_year: 1805
description: "फोर्ट विलियम कॉलेज (कलकत्ता) के प्राध्यापक लल्लूजीलाल द्वारा रचित आधुनिक खड़ी बोली हिन्दी गद्य का ऐतिहासिक प्रथम महा-आख्यान (१८०५)। श्रीमद्भागवत दशम स्कंध पर आधारित भगवान श्रीकृष्ण के जन्मोत्सव, बाललीला, मथुरा-विजय और द्वारिका-विहार का सम्पूर्ण ९० अध्यायों में रससिक्त वर्णन।"
keywords: ["premsagar", "lallu lal", "fort william college", "khari boli", "early hindi prose", "krishna leela"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^प्रेमसागर\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-15] Ingested Premsagar chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-15] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'premsagar.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-15] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'premsagar',
    title_hi: 'प्रेमसागर',
    title_en: 'Premsagar',
    author_hi: 'लल्लू लाल',
    author_en: 'Lallu Lal',
    category_hi: 'उपन्यास',
    category_en: 'Classic Narrative / Early Prose',
    published_year: 1805,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/प्रेमसागर',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१८०५/१८१० फोर्ट विलियम कॉलेज व नवलकिशोर प्रेस से सत्यापित लल्लू लाल (१७६३–१८२५) का सम्पूर्ण ९० अध्यायों का खड़ी बोली हिन्दी गद्य आख्यान।'
  });
}

// 3. Ingest Sahityalaap (साहित्यालाप - आचार्य महावीर प्रसाद द्विवेदी)
async function ingestSahityalaap() {
  console.log('[BATCH-15] 3/5 Fetching साहित्यालाप (आचार्य महावीर प्रसाद द्विवेदी)...');

  const essays = [
    { title: 'देवनागरी-लिपि का उत्पत्ति-काल', page: 'साहित्यालाप/१ देवनागरी-लिपि का उत्पत्ति-काल' },
    { title: 'देवनागरी लिपि के प्रचार का प्रयत्न', page: 'साहित्यालाप/२—देवनागरी लिपि के प्रचार का प्रयत्न' },
    { title: 'नई रोमन-लिपि के प्रचार का प्रयत्न', page: 'साहित्यालाप/३—नई रोमन-लिपि के प्रचार का प्रयत्न' },
    { title: 'देशव्यापक भाषा', page: 'साहित्यालाप/४—देशव्यापक भाषा' },
    { title: 'देशव्यापक लिपि', page: 'साहित्यालाप/५ देशव्यापक लिपि' },
    { title: 'हिन्दी भाषा और उसका साहित्य', page: 'साहित्यालाप/६—हिन्दी भाषा और उसका साहित्य' },
    { title: 'हिन्दी की वर्त्तमान अवस्था', page: 'साहित्यालाप/७—हिन्दी की वर्त्तमान अवस्था' },
    { title: 'कौंसिल में हिन्दी', page: 'साहित्यालाप/८—कौंसिल में हिन्दी' },
    { title: 'भारतीय भाषायें और अँगरेज़', page: 'साहित्यालाप/९—भारतीय भाषायें और अँगरेज़' },
    { title: 'मर्दुमशुमारी की रिपोर्ट में हिन्दी उर्दू', page: 'साहित्यालाप/१०—मर्दुमशुमारी की रिपोर्ट में हिन्दी उर्दू' },
    { title: 'उर्दू और आज़ाद', page: 'साहित्यालाप/११—उर्दू और आज़ाद' },
    { title: 'मर्दुमशुमारी की हिन्दुस्तानी भाषा', page: 'साहित्यालाप/१२—मर्दुमशुमारी की हिन्दुस्तानी भाषा' },
    { title: 'विदेशी गवर्नमेंट और स्वदेशी भाषायें', page: 'साहित्यालाप/१३ विदेशी गवर्नमेंट और स्वदेशी भाषायें' },
    { title: 'कवि सम्मेलन', page: 'साहित्यालाप/१४—कवि सम्मेलन' },
    { title: 'पठानी सिक्कों पर नागरी', page: 'साहित्यालाप/१५—पठानी सिक्कों पर नागरी' },
    { title: 'वक्तव्य', page: 'साहित्यालाप/१६ वक्तव्य' },
    { title: 'विचार-विपर्य्यय', page: 'साहित्यालाप/१७—विचार-विपर्य्यय' },
    { title: 'आज कल के छायावादी कवि और कविता', page: 'साहित्यालाप/१८—आज कल के छायावादी कवि और कविता' }
  ];

  let mdContent = `---
id: "sahityalaap"
title: "साहित्यालाप"
title_en: "Sahityalaap"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "निबन्ध"
category_en: "Essays / Linguistics"
published_year: 1929
description: "द्विवेदी युग के नियामक आचार्य महावीर प्रसाद द्विवेदी के १८ प्रखर भाषाशास्त्रीय एवं साहित्यिक निबन्धों का संकलन। देवनागरी लिपि का उद्भव व प्रसार, हिन्दी-उर्दू विवाद, जनगणना में भाषा की राजनीति और छायावादी कविता पर प्रामाणिक विमर्श।"
keywords: ["sahityalaap", "mahavir prasad dwivedi", "devanagari", "linguistics", "hindi urdu", "chhayavad", "nibandh"]
cover: ""
---

`;

  let totalEssays = 0;
  for (const item of essays) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalEssays++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-15] Ingested Dwivedi essay ${totalEssays}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-15] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'sahityalaap.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-15] Saved ${filePath} with ${totalEssays} essays.`);

  logSourceRecord({
    id: 'sahityalaap',
    title_hi: 'साहित्यालाप',
    title_en: 'Sahityalaap',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'निबन्ध',
    category_en: 'Essays / Linguistics',
    published_year: 1929,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/साहित्यालाप',
    ingested_at: '2026-11-14',
    chapter_count: totalEssays,
    verification_notes: '१९२९ गंगा-पुस्तक-माला कार्यालय, लखनऊ से प्रकाशित आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) के १८ आलोचनात्मक व भाषाशास्त्रीय निबन्ध।'
  });
}

// 4. Ingest Dharm Ke Naam Par (धर्म के नाम पर - आचार्य चतुरसेन शास्त्री)
async function ingestDharmKeNaamPar() {
  console.log('[BATCH-15] 4/5 Fetching धर्म के नाम पर (आचार्य चतुरसेन शास्त्री)...');

  const chapters = [
    { title: 'अध्याय १: धर्म क्या है?', page: 'धर्म के नाम पर/1 धर्म क्या है?' },
    { title: 'अध्याय २: सदुपयोग और दुरुपयोग', page: 'धर्म के नाम पर/2 सदुपयोग और दुरुपयोग' },
    { title: 'अध्याय ३: अन्धविश्वास और कुसंस्कार', page: 'धर्म के नाम पर/3 अन्धविश्वास और कुसंस्कार' },
    { title: 'अध्याय ४: अत्याचार', page: 'धर्म के नाम पर/4 अत्याचार' },
    { title: 'अध्याय ५: हत्या', page: 'धर्म के नाम पर/5 हत्या' },
    { title: 'अध्याय ६: व्यभिचार', page: 'धर्म के नाम पर/6 व्यभिचार' },
    { title: 'अध्याय ७: अपराध', page: 'धर्म के नाम पर/7 अपराध' },
    { title: 'अध्याय ८: कुरीति और रूढ़ियां', page: 'धर्म के नाम पर/8 कुरीति और रूढ़ियां' },
    { title: 'अध्याय ९: पाखण्ड', page: 'धर्म के नाम पर/9 पाखण्ड' },
    { title: 'अध्याय १०: धर्म नीति', page: 'धर्म के नाम पर/10 धर्म नीति' }
  ];

  let mdContent = `---
id: "dharm-ke-naam-par"
title: "धर्म के नाम पर"
title_en: "Dharm Ke Naam Par"
author: "आचार्य चतुरसेन शास्त्री"
author_en: "Acharya Chatursen Shastri"
category: "निबन्ध"
category_en: "Philosophy & Social Reform"
published_year: 1933
description: "आचार्य चतुरसेन शास्त्री का निर्भीक एवं क्रान्तिकारी वैचारिक ग्रंथ। धर्म के नाम पर सदियों से फैले अंधविश्वास, कुरीतियों, पाखंड, शोषण और रूढ़ियों का ऐतिहासिक एवं तार्किक पर्दाफ़ाश करते हुए विशुद्ध मानवतावादी धर्म-नीति का प्रतिपादन।"
keywords: ["dharm ke naam par", "chatursen shastri", "social reform", "rationalism", "philosophy", "anti superstition"]
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
        console.log(`[BATCH-15] Ingested Chatursen chapter ${totalChapters}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-15] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'dharm-ke-naam-par.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-15] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'dharm-ke-naam-par',
    title_hi: 'धर्म के नाम पर',
    title_en: 'Dharm Ke Naam Par',
    author_hi: 'आचार्य चतुरसेन शास्त्री',
    author_en: 'Acharya Chatursen Shastri',
    category_hi: 'निबन्ध',
    category_en: 'Philosophy & Social Reform',
    published_year: 1933,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/धर्म_के_नाम_पर',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९३३ शान्ति-साहित्य-सदन से प्रकाशित आचार्य चतुरसेन शास्त्री (१८९१–१९६०) का १० अध्यायों का समाज-सुधारक वैचारिक ग्रंथ।'
  });
}

// 5. Ingest Awaragard (आवारागर्द - आचार्य चतुरसेन शास्त्री)
async function ingestAwaragard() {
  console.log('[BATCH-15] 5/5 Fetching आवारागर्द (आचार्य चतुरसेन शास्त्री)...');

  const stories = [
    { title: 'आवारागर्द', page: 'आवारागर्द/१-आवारागर्द' },
    { title: 'तिकड़म', page: 'आवारागर्द/२-तिकड़म' },
    { title: 'डाक्टर साहब की घड़ी', page: 'आवारागर्द/३-डाक्टर साहब की घड़ी' },
    { title: 'मरम्मत', page: 'आवारागर्द/४-मरम्मत' },
    { title: 'चिट्ठी की दोस्ती', page: 'आवारागर्द/५-चिट्ठी की दोस्ती' },
    { title: 'तसवीर', page: 'आवारागर्द/६-तसवीर' },
    { title: 'तेरह बरस बाद', page: 'आवारागर्द/७-तेरह बरस बाद' },
    { title: 'जापानी दासी', page: 'आवारागर्द/८-जापानी दासी' },
    { title: 'हेर फेर', page: 'आवारागर्द/९-हेर फेर' },
    { title: 'वह कहे तो?', page: 'आवारागर्द/१०-वह कहे तो?' }
  ];

  let mdContent = `---
id: "awaragard"
title: "आवारागर्द"
title_en: "Awaragard"
author: "आचार्य चतुरसेन शास्त्री"
author_en: "Acharya Chatursen Shastri"
category: "कहानी संग्रह"
category_en: "Short Stories"
published_year: 1928
description: "आचार्य चतुरसेन शास्त्री का लोकप्रिय सामाजिक कथा संकलन। आधुनिक जीवन की विडम्बनाओं, रोचक अनुभवों, मानव-स्वभाव के विविध रंगों और रोमांचकारी मोड़ों से परिपूर्ण १० प्रतिनिधि कहानियों का अनूठा संग्रह।"
keywords: ["awaragard", "chatursen shastri", "tikdam", "japani dasi", "hindi kahaniya", "stories"]
cover: ""
---

`;

  let totalStories = 0;
  for (const item of stories) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalStories++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-15] Ingested Chatursen story ${totalStories}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-15] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'awaragard.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-15] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'awaragard',
    title_hi: 'आवारागर्द',
    title_en: 'Awaragard',
    author_hi: 'आचार्य चतुरसेन शास्त्री',
    author_en: 'Acharya Chatursen Shastri',
    category_hi: 'कहानी संग्रह',
    category_en: 'Short Stories',
    published_year: 1928,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/आवारागर्द',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: 'आचार्य चतुरसेन शास्त्री (१८९१–१९६०) का १० लोकप्रिय कहानियों का प्रतिनिधि संकलन, भारतीय कॉपीराइट अधिनियम १९५७ अनुसार सार्वजनिक डोमेन।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 15 INGESTION ===');
  await ingestHindiSahityaKaItihas();
  await ingestPremsagar();
  await ingestSahityalaap();
  await ingestDharmKeNaamPar();
  await ingestAwaragard();
  console.log('=== BATCH 15 INGESTION COMPLETE ===');
}

main().catch(console.error);
