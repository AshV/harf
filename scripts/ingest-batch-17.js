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
  cleaned = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|पीछे|मुखपृष्ठ|अगला भाग|अगला अध्याय|पिछला अध्याय)[^\n]*?\n+/gis, '');
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

// 1. Ingest Sau Ajaan Aur Ek Sujaan (सौ अजान और एक सुजान - पं. बालकृष्ण भट्ट)
async function ingestSauAjaanAurEkSujaan() {
  console.log('[BATCH-17] 1/5 Fetching सौ अजान और एक सुजान (पं. बालकृष्ण भट्ट)...');

  let mdContent = `---
id: "sau-ajaan-aur-ek-sujaan"
title: "सौ अजान और एक सुजान"
title_en: "Sau Ajaan Aur Ek Sujaan"
author: "पं. बालकृष्ण भट्ट"
author_en: "Pt. Balkrishna Bhatt"
category: "उपन्यास"
category_en: "Novel / Early Hindi Fiction"
published_year: 1892
description: "भारतेन्दु मण्डल के प्रमुख स्तम्भ व हिन्दी प्रदीप के सम्पादक पं. बालकृष्ण भट्ट द्वारा रचित हिन्दी का अग्रदूत उपन्यास (१८९२)। कुसंगति के दुष्परिणाम, नीति, सद्विवेक और एक बुद्धिमान मित्र के प्रभाव से बिगड़े हुए युवक के उद्धार की रोचक सामाजिक आख्यायिका।"
keywords: ["sau ajaan aur ek sujaan", "balkrishna bhatt", "hindi pradeep", "early novel", "upanyas"]
cover: ""
---

`;

  let totalChapters = 0;
  for (let i = 1; i <= 23; i++) {
    const pageTitle = `सौ अजान और एक सुजान/${toHindiNum(i)}`;
    try {
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# प्रस्ताव ${toHindiNum(i)}\n\n${clean}\n\n`;
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-17] Error fetching ${pageTitle}:`, e.message);
    }
  }

  // Appendix / Vocabulary
  try {
    const vocabRaw = await fetchWikiPage('सौ अजान और एक सुजान/शब्दार्थ-सूची');
    const vocabClean = stripNavHeader(cleanWikiHtml(vocabRaw));
    if (vocabClean.length > 50) {
      mdContent += `\n# शब्दार्थ-सूची\n\n${vocabClean}\n\n`;
    }
  } catch (e) {
    // optional vocab
  }

  const filePath = path.join(RAW_DIR, 'sau-ajaan-aur-ek-sujaan.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-17] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'sau-ajaan-aur-ek-sujaan',
    title_hi: 'सौ अजान और एक सुजान',
    title_en: 'Sau Ajaan Aur Ek Sujaan',
    author_hi: 'पं. बालकृष्ण भट्ट',
    author_en: 'Pt. Balkrishna Bhatt',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Early Hindi Fiction',
    published_year: 1892,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/सौ_अजान_और_एक_सुजान',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१८९२/१९४४ भारत-जीवन प्रेस व हिन्दी-प्रदीप से सत्यापित पं. बालकृष्ण भट्ट (१८४४–१९१४) का कालजयी सामाजिक उपन्यास।'
  });
}

// 2. Ingest Pratap Peeyush (प्रताप पीयूष - पं. प्रतापनारायण मिश्र)
async function ingestPratapPeeyush() {
  console.log('[BATCH-17] 2/5 Fetching प्रताप पीयूष (पं. प्रतापनारायण मिश्र)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('प्रताप पीयूष/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  let mdContent = `---
id: "pratap-peeyush"
title: "प्रताप पीयूष"
title_en: "Pratap Peeyush"
author: "पं. प्रतापनारायण मिश्र"
author_en: "Pt. Pratap Narayan Mishra"
category: "निबन्ध"
category_en: "Essays & Satire"
published_year: 1933
description: "भारतेन्दु युग के मूर्धन्य हास्य-व्यंग्यकार एवं 'ब्राह्मण' पत्र के संपादक पं. प्रतापनारायण मिश्र के प्रतिनिधि निबन्धों का प्रामाणिक संकलन। 'धोखा', 'दांत', 'भौं', 'खुशामद', 'युवावस्था', 'बुढ़ापा' और 'शिव मूर्ति' जैसे अनूठे, चुटीले व विचारोत्तेजक निबन्ध।"
keywords: ["pratap peeyush", "pratap narayan mishra", "satire", "brahman patrika", "hindi nibandh", "humour"]
cover: ""
---

`;

  let totalEssays = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^प्रताप पीयूष\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalEssays++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        if (totalEssays % 10 === 0 || totalEssays === subpages.length) {
          console.log(`[BATCH-17] Ingested Pratap Peeyush essay ${totalEssays}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-17] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'pratap-peeyush.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-17] Saved ${filePath} with ${totalEssays} essays.`);

  logSourceRecord({
    id: 'pratap-peeyush',
    title_hi: 'प्रताप पीयूष',
    title_en: 'Pratap Peeyush',
    author_hi: 'पं. प्रतापनारायण मिश्र',
    author_en: 'Pt. Pratap Narayan Mishra',
    category_hi: 'निबन्ध',
    category_en: 'Essays & Satire',
    published_year: 1933,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/प्रताप_पीयूष',
    ingested_at: '2026-11-14',
    chapter_count: totalEssays,
    verification_notes: '१९३३ सुधा-कार्यालय, लखनऊ से प्रकाशित पं. प्रतापनारायण मिश्र (१८५६–१८९४) के प्रतिनिधि हास्य-व्यंग्यात्मक व सामाजिक निबन्धों का संग्रह।'
  });
}

// 3. Ingest Mansarovar 1 (मानसरोवर भाग १ - मुंशी प्रेमचंद)
async function ingestMansarovar1() {
  console.log('[BATCH-17] 3/5 Fetching मानसरोवर (भाग १) (मुंशी प्रेमचंद)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('मानसरोवर १/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  let mdContent = `---
id: "mansarovar-1"
title: "मानसरोवर (भाग १)"
title_en: "Mansarovar Part 1"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "कहानी संग्रह"
category_en: "Short Stories"
published_year: 1936
description: "मुंशी प्रेमचंद के अमर कथा-साहित्य का पहला व सर्वाधिक लोकप्रिय खण्ड। इसमें 'पूस की रात', 'ठाकुर का कुआँ', 'गुल्ली-डण्डा', 'अलग्योझा', 'घासवाली', 'नशा', 'माँ', 'झाँकी', 'तावान', 'बेटोंवाली विधवा' और 'सुभागी' जैसी हिन्दी की २७ कालजयी कहानियाँ संकलित हैं।"
keywords: ["mansarovar", "munshi premchand", "poos ki raat", "thakur ka kuan", "gulli danda", "alagyoojha", "hindi kahaniya"]
cover: ""
---

`;

  let totalStories = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^मानसरोवर १\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalStories++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-17] Ingested Mansarovar 1 story ${totalStories}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-17] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'mansarovar-1.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-17] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'mansarovar-1',
    title_hi: 'मानसरोवर (भाग १)',
    title_en: 'Mansarovar Part 1',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'कहानी संग्रह',
    category_en: 'Short Stories',
    published_year: 1936,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/मानसरोवर_१',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: '१९३६/१९४७ हंस प्रकाशन / सरस्वती प्रेस से सत्यापित मुंशी प्रेमचंद की २७ कालजयी कहानियों का संकलन (पूस की रात, ठाकुर का कुआँ, गुल्ली-डण्डा सहित)।'
  });
}

// 4. Ingest Aag Aur Dhuan (आग और धुआं - आचार्य चतुरसेन शास्त्री)
async function ingestAagAurDhuan() {
  console.log('[BATCH-17] 4/5 Fetching आग और धुआं (आचार्य चतुरसेन शास्त्री)...');

  let mdContent = `---
id: "aag-aur-dhuan"
title: "आग और धुआं"
title_en: "Aag Aur Dhuan"
author: "आचार्य चतुरसेन शास्त्री"
author_en: "Acharya Chatursen Shastri"
category: "कहानी संग्रह"
category_en: "Short Stories / Historical Fiction"
published_year: 1935
description: "ऐतिहासिक शौर्य और सामाजिक यथार्थ के सिद्धहस्त लेखक आचार्य चतुरसेन शास्त्री का १९ रोचक एवं विचारोत्तेजक कहानियों का संकलन। ईस्ट इंडिया कम्पनी के आरम्भ, अवध के नवाबों, मुगलों के अवसान और मानवीय मनोभावों का अद्भुत आख्यान।"
keywords: ["aag aur dhuan", "acharya chatursen shastri", "historical stories", "east india company", "hindi kahaniya"]
cover: ""
---

`;

  let totalStories = 0;
  for (let i = 1; i <= 19; i++) {
    const pageTitle = `आग और धुआं/${i}`;
    try {
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalStories++;
        mdContent += `\n# अध्याय ${toHindiNum(i)}\n\n${clean}\n\n`;
        console.log(`[BATCH-17] Ingested Aag Aur Dhuan story ${totalStories}/19 (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-17] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'aag-aur-dhuan.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-17] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'aag-aur-dhuan',
    title_hi: 'आग और धुआं',
    title_en: 'Aag Aur Dhuan',
    author_hi: 'आचार्य चतुरसेन शास्त्री',
    author_en: 'Acharya Chatursen Shastri',
    category_hi: 'कहानी संग्रह',
    category_en: 'Short Stories / Historical Fiction',
    published_year: 1935,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/आग_और_धुआं',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: 'आचार्य चतुरसेन शास्त्री (१८९१–१९६०) का १९ ऐतिहासिक व सामाजिक कथाओं का संग्रह, भारतीय कॉपीराइट अधिनियम १९५७ अनुसार सार्वजनिक डोमेन।'
  });
}

// 5. Ingest Chandrakanta Santati 3 (चन्द्रकांता संतति भाग ३ - बाबू देवकीनन्दन खत्री)
async function ingestChandrakantaSantati3() {
  console.log('[BATCH-17] 5/5 Fetching चन्द्रकांता संतति (भाग ३) (देवकीनन्दन खत्री)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('चन्द्रकांता सन्तति 3/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  let mdContent = `---
id: "chandrakanta-santati-3"
title: "चंद्रकांता संतति (भाग ३)"
title_en: "Chandrakanta Santati Part 3"
author: "देवकीनंदन खत्री"
author_en: "Devaki Nandan Khatri"
category: "उपन्यास"
category_en: "Novel / Mystery & Fantasy"
published_year: 1896
description: "हिन्दी के प्रथम तिलिस्मी-ऐयारी महा-उपन्यास की तीसरी कड़ी। रोहतासगढ़ का रहस्य, तिलिस्मी बाग, गुप्त सुरंगे, जादुई षड्यंत्र और ऐयारों की अद्भुत करामातों से भरपूर बयान ९ से १२ तक का सम्पूर्ण रोमांचक आख्यान।"
keywords: ["chandrakanta santati", "devaki nandan khatri", "tilasm", "aiyari", "fantasy novel", "part 3"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^चन्द्रकांता सन्तति 3\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# बयान ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-17] Ingested Chandrakanta Santati 3 chapter ${totalChapters}/${subpages.length}: बयान ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-17] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'chandrakanta-santati-3.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-17] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'chandrakanta-santati-3',
    title_hi: 'चंद्रकांता संतति (भाग ३)',
    title_en: 'Chandrakanta Santati Part 3',
    author_hi: 'देवकीनंदन खत्री',
    author_en: 'Devaki Nandan Khatri',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Mystery & Fantasy',
    published_year: 1896,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/चन्द्रकांता_सन्तति_3',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१८९६ लहरी प्रेस, बनारस से सत्यापित बाबू देवकीनन्दन खत्री का तिलिस्मी-ऐयारी उपन्यास चंद्रकांता संतति (बयान ९ से १२)।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 17 INGESTION ===');
  await ingestSauAjaanAurEkSujaan();
  await ingestPratapPeeyush();
  await ingestMansarovar1();
  await ingestAagAurDhuan();
  await ingestChandrakantaSantati3();
  console.log('=== BATCH 17 INGESTION COMPLETE ===');
}

main().catch(console.error);
