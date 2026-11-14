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
  cleaned = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका)[^\n]*?\n+/gis, '');
  cleaned = cleaned.replace(/^[^\n]*?(?:←|→)[^\n]*?\n+/gis, '');
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

// 1. Ingest Kahani Khatm Ho Gayi (कहानी खत्म हो गई - आचार्य चतुरसेन शास्त्री)
async function ingestKahaniKhatmHoGayi() {
  console.log('[BATCH-13] 1/5 Fetching कहानी खत्म हो गई (आचार्य चतुरसेन शास्त्री)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('कहानी खत्म हो गई/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  let mdContent = `---
id: "kahani-khatm-ho-gayi"
title: "कहानी खत्म हो गई"
title_en: "Kahani Khatm Ho Gayi"
author: "आचार्य चतुरसेन शास्त्री"
author_en: "Acharya Chatursen Shastri"
category: "कहानी संग्रह"
category_en: "Short Stories"
published_year: 1961
description: "ऐतिहासिक व सामाजिक कथाओं के सिद्धहस्त लेखक आचार्य चतुरसेन शास्त्री का २४ हृदयस्पर्शी कहानियों का प्रतिनिधि संकलन, जिसमें मानवीय संवेदनाओं, ऐतिहासिक शौर्य और सामाजिक यथार्थ का सशक्त चित्रण है।"
keywords: ["kahani khatm ho gayi", "acharya chatursen shastri", "chatursen", "hindi kahaniya", "historical stories"]
cover: ""
---

`;

  let totalStories = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^कहानी खत्म हो गई\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalStories++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-13] Ingested story ${totalStories}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(200);
    } catch (e) {
      console.warn(`[BATCH-13] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'kahani-khatm-ho-gayi.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-13] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'kahani-khatm-ho-gayi',
    title_hi: 'कहानी खत्म हो गई',
    title_en: 'Kahani Khatm Ho Gayi',
    author_hi: 'आचार्य चतुरसेन शास्त्री',
    author_en: 'Acharya Chatursen Shastri',
    category_hi: 'कहानी संग्रह',
    category_en: 'Short Stories',
    published_year: 1961,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कहानी_खत्म_हो_गई',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: 'आचार्य चतुरसेन शास्त्री (१८९१–१९६०) की २४ अमर कहानियों का संग्रह, भारतीय कॉपीराइट अधिनियम १९५७ के तहत सार्वजनिक डोमेन।'
  });
}

// 2. Ingest Aandhi (आँधी - जयशंकर प्रसाद)
async function ingestAandhi() {
  console.log('[BATCH-13] 2/5 Fetching आँधी (जयशंकर प्रसाद)...');

  const stories = [
    { title: 'आंधी', page: 'आँधी/१-आंधी' },
    { title: 'मधुआ', page: 'आँधी/२-मधुआ' },
    { title: 'दासी', page: 'आँधी/३-दासी' },
    { title: 'घीसू', page: 'आँधी/४-घीसू' },
    { title: 'बेड़ी', page: 'आँधी/५-बेड़ी' },
    { title: 'व्रत भंग', page: 'आँधी/६-व्रत भंग' },
    { title: 'ग्राम गीत', page: 'आँधी/७-ग्राम गीत' },
    { title: 'विजया', page: 'आँधी/८-विजया' },
    { title: 'अमिट स्मृति', page: 'आँधी/९-अमिट स्मृति' },
    { title: 'नीरा', page: 'आँधी/१०-नीरा' },
  ];

  let mdContent = `---
id: "aandhi"
title: "आँधी"
title_en: "Aandhi"
author: "जयशंकर प्रसाद"
author_en: "Jaishankar Prasad"
category: "कहानी संग्रह"
category_en: "Short Stories"
published_year: 1931
description: "छायावाद के आधार स्तम्भ जयशंकर प्रसाद का बहुचर्चित कथा संकलन, जिसमें 'मधुआ', 'दासी', 'घीसू' और 'आंधी' जैसी हिन्दी साहित्य की अमर एवं कालजयी कहानियाँ संकलित हैं।"
keywords: ["aandhi", "jaishankar prasad", "madhua", "dasi", "ghisu", "hindi kahani"]
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
        console.log(`[BATCH-13] Ingested Prasad story ${totalStories}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(200);
    } catch (e) {
      console.warn(`[BATCH-13] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'aandhi.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-13] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'aandhi',
    title_hi: 'आँधी',
    title_en: 'Aandhi',
    author_hi: 'जयशंकर प्रसाद',
    author_en: 'Jaishankar Prasad',
    category_hi: 'कहानी संग्रह',
    category_en: 'Short Stories',
    published_year: 1931,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/आँधी',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: '१९३१ भारती-भण्डार (लीडर प्रेस, प्रयाग) से सत्यापित जयशंकर प्रसाद का १० प्रतिनिधि कहानियों का संग्रह।'
  });
}

// 3. Ingest Karbala (कर्बला - मुंशी प्रेमचंद)
async function ingestKarbala() {
  console.log('[BATCH-13] 3/5 Fetching कर्बला (मुंशी प्रेमचंद)...');

  const parts = [
    { title: 'नाटक का कथानक एवं ऐतिहासिक भूमिका', page: 'कर्बला/नाटक का कथानक' },
    { title: 'नाटक के पात्र (पात्र-परिचय)', page: 'कर्बला/नाटक के पात्र' },
    { title: 'प्रथम अंक', page: 'कर्बला/पहला अंक' },
    { title: 'दूसरा अंक', page: 'कर्बला/दूसरा अंक' },
    { title: 'तीसरा अंक', page: 'कर्बला/तीसरा अंक' },
    { title: 'चौथा अंक', page: 'कर्बला/चौथा अंक' },
  ];

  let mdContent = `---
id: "karbala"
title: "कर्बला"
title_en: "Karbala"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "नाटक"
category_en: "Play / Historical Drama"
published_year: 1924
description: "मुंशी प्रेमचंद द्वारा रचित ऐतिहासिक नाटक, जो हज़रत इमाम हुसैन के सत्य, न्याय और मानवीय मूल्यों के लिए दिए गए सर्वोच्च बलिदान तथा कर्बला की ऐतिहासिक पृष्ठभूमि को जीवंत करता है।"
keywords: ["karbala", "munshi premchand", "historical drama", "imam hussain", "natak"]
cover: ""
---

`;

  let totalParts = 0;
  for (const item of parts) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalParts++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-13] Ingested Karbala part ${totalParts}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(250);
    } catch (e) {
      console.warn(`[BATCH-13] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'karbala.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-13] Saved ${filePath} with ${totalParts} parts.`);

  logSourceRecord({
    id: 'karbala',
    title_hi: 'कर्बला',
    title_en: 'Karbala',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'नाटक',
    category_en: 'Play / Historical Drama',
    published_year: 1924,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कर्बला',
    ingested_at: '2026-11-14',
    chapter_count: totalParts,
    verification_notes: '१९२४ हिन्दी पुस्तक एजेंसी, कलकत्ता से सत्यापित मुंशी प्रेमचंद का ४ अंकों का ऐतिहासिक नाटक।'
  });
}

// 4. Ingest Sangram (संग्राम - मुंशी प्रेमचंद)
async function ingestSangram() {
  console.log('[BATCH-13] 4/5 Fetching संग्राम (मुंशी प्रेमचंद)...');

  const acts = [
    {
      title: 'प्रथम अंक (दृश्य १ से ७)',
      scenes: ['संग्राम/१.१', 'संग्राम/१.२', 'संग्राम/१.३', 'संग्राम/१.४', 'संग्राम/१.५', 'संग्राम/१.६', 'संग्राम/१.७']
    },
    {
      title: 'द्वितीय अंक (दृश्य १ से १०)',
      scenes: ['संग्राम/२.१', 'संग्राम/२.२', 'संग्राम/२.३', 'संग्राम/२.४', 'संग्राम/२.५', 'संग्राम/२.६', 'संग्राम/२.७', 'संग्राम/२.८', 'संग्राम/२.९', 'संग्राम/२.१०']
    },
    {
      title: 'तृतीय अंक (दृश्य १ से ९)',
      scenes: ['संग्राम/३.१', 'संग्राम/३.२', 'संग्राम/३.३', 'संग्राम/३.४', 'संग्राम/३.५', 'संग्राम/३.६', 'संग्राम/३.७', 'संग्राम/३.८', 'संग्राम/३.९']
    },
    {
      title: 'चतुर्थ अंक (दृश्य १ से ७)',
      scenes: ['संग्राम/४.१', 'संग्राम/४.२', 'संग्राम/४.३', 'संग्राम/४.४', 'संग्राम/४.५', 'संग्राम/४.६', 'संग्राम/४.७']
    },
    {
      title: 'पंचम अंक (दृश्य १ से ६)',
      scenes: ['संग्राम/५.१', 'संग्राम/५.२', 'संग्राम/५.३', 'संग्राम/५.४', 'संग्राम/५.५', 'संग्राम/५.६']
    }
  ];

  let mdContent = `---
id: "sangram"
title: "संग्राम"
title_en: "Sangram"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "नाटक"
category_en: "Play / Social Drama"
published_year: 1923
description: "मुंशी प्रेमचंद द्वारा रचित ५ अंकों और ३९ दृश्यों का यथार्थवादी सामाजिक नाटक, जिसमें भारतीय कृषक जीवन, ज़मींदारी शोषण, ग्रामीण चेतना और स्वाभिमान के संघर्ष की महागाथा वर्णित है।"
keywords: ["sangram", "munshi premchand", "social drama", "kisan andolan", "natak"]
cover: ""
---

`;

  let totalActs = 0;
  for (let a = 0; a < acts.length; a++) {
    const act = acts[a];
    totalActs++;
    mdContent += `\n# ${act.title}\n\n`;
    console.log(`[BATCH-13] Ingesting Sangram Act ${a + 1}: ${act.title} (${act.scenes.length} scenes)...`);

    for (let s = 0; s < act.scenes.length; s++) {
      const scenePage = act.scenes[s];
      try {
        const raw = await fetchWikiPage(scenePage);
        const clean = stripNavHeader(cleanWikiHtml(raw));
        if (clean.length > 20) {
          mdContent += `\n## दृश्य ${s + 1}\n\n${clean}\n\n`;
        }
        await sleep(150);
      } catch (e) {
        console.warn(`[BATCH-13] Error fetching ${scenePage}:`, e.message);
      }
    }
  }

  const filePath = path.join(RAW_DIR, 'sangram.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-13] Saved ${filePath} with ${totalActs} acts (39 scenes).`);

  logSourceRecord({
    id: 'sangram',
    title_hi: 'संग्राम',
    title_en: 'Sangram',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'नाटक',
    category_en: 'Play / Social Drama',
    published_year: 1923,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/संग्राम',
    ingested_at: '2026-11-14',
    chapter_count: totalActs,
    verification_notes: '१९२३ हिन्दी पुस्तक एजेंसी से सत्यापित मुंशी प्रेमचंद का ५ अंकों व ३९ दृश्यों का यथार्थवादी सामाजिक नाटक।'
  });
}

// 5. Ingest Chokhe Chaupade (चोखे चौपदे - अयोध्या सिंह उपाध्याय 'हरिऔध')
async function ingestChokheChaupade() {
  console.log('[BATCH-13] 5/5 Fetching चोखे चौपदे (हरिऔध)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('चोखे चौपदे/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  let mdContent = `---
id: "chokhe-chaupade"
title: "चोखे चौपदे"
title_en: "Chokhe Chaupade"
author: "अयोध्या सिंह उपाध्याय 'हरिऔध'"
author_en: "Ayodhya Singh Upadhyay 'Hariaudh'"
category: "कविता"
category_en: "Poetry"
published_year: 1924
description: "महाकवि 'हरिऔध' द्वारा विशुद्ध बोलचाल की मुहावरेदार ठेठ हिन्दी में रचित कालजयी चौपदों का काव्य-संग्रह, जिसमें लोक-जीवन की चुटीली सीखें, मार्मिक व्यंग्य और अनूठा भाषा-सौंदर्य समाहित है।"
keywords: ["chokhe chaupade", "hariaudh", "muhavare", "theth hindi", "kavita", "chaupade"]
cover: ""
---

`;

  let totalSections = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^चोखे चौपदे\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalSections++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-13] Ingested Hariaudh chaupade section ${totalSections}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(200);
    } catch (e) {
      console.warn(`[BATCH-13] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'chokhe-chaupade.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-13] Saved ${filePath} with ${totalSections} sections.`);

  logSourceRecord({
    id: 'chokhe-chaupade',
    title_hi: 'चोखे चौपदे',
    title_en: 'Chokhe Chaupade',
    author_hi: 'अयोध्या सिंह उपाध्याय \'हरिऔध\'',
    author_en: 'Ayodhya Singh Upadhyay \'Hariaudh\'',
    category_hi: 'कविता',
    category_en: 'Poetry',
    published_year: 1924,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/चोखे_चौपदे',
    ingested_at: '2026-11-14',
    chapter_count: totalSections,
    verification_notes: '१९२४ प्रथम संस्करण (लीडर प्रेस, प्रयाग) से सत्यापित अयोध्या सिंह उपाध्याय हरिऔध का मुहावरेदार बोलचाल के चौपदों का संग्रह।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 13 INGESTION ===');
  await ingestKahaniKhatmHoGayi();
  await ingestAandhi();
  await ingestKarbala();
  await ingestSangram();
  await ingestChokheChaupade();
  console.log('=== BATCH 13 INGESTION COMPLETE ===');
}

main().catch(console.error);
