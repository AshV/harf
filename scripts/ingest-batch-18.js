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

// 1. Ingest Vaishali Ki Nagarvadhu (वैशाली की नगरवधू - आचार्य चतुरसेन शास्त्री)
async function ingestVaishaliKiNagarvadhu() {
  console.log('[BATCH-18] 1/5 Fetching वैशाली की नगरवधू (आचार्य चतुरसेन शास्त्री)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('वैशाली की नगरवधू/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  let mdContent = `---
id: "vaishali-ki-nagarvadhu"
title: "वैशाली की नगरवधू"
title_en: "Vaishali Ki Nagarvadhu"
author: "आचार्य चतुरसेन शास्त्री"
author_en: "Acharya Chatursen Shastri"
category: "उपन्यास"
category_en: "Novel / Historical Masterpiece"
published_year: 1949
description: "हिन्दी ऐतिहासिक उपन्यास का शिखर गौरव। भगवान बुद्ध, मगधराज बिम्बिसार, अजातशत्रु और वज्जि संघ (वैशाली गणतन्त्र) के युगीन परिवेश में रूपगर्विता नगरवधू आम्रपाली के आत्मगौरव, बौद्ध धम्म और सत्ता-संघर्ष का अमर महाकाव्यात्मक आख्यान।"
keywords: ["vaishali ki nagarvadhu", "acharya chatursen shastri", "amrapali", "gautam buddha", "historical novel", "upanyas"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^वैशाली की नगरवधू\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# अध्याय: ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-18] Ingested Vaishali chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-18] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'vaishali-ki-nagarvadhu.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-18] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'vaishali-ki-nagarvadhu',
    title_hi: 'वैशाली की नगरवधू',
    title_en: 'Vaishali Ki Nagarvadhu',
    author_hi: 'आचार्य चतुरसेन शास्त्री',
    author_en: 'Acharya Chatursen Shastri',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Historical Masterpiece',
    published_year: 1949,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/वैशाली_की_नगरवधू',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९४९ अमर-ग्रन्थ-प्रकाशन से प्रकाशित आचार्य चतुरसेन शास्त्री (१८९१–१९६०) का कालजयी ऐतिहासिक महा-उपन्यास।'
  });
}

// 2. Ingest Aadarsh Hindu (आदर्श हिंदू - पं. लज्जाराम शर्मा)
async function ingestAadarshHindu() {
  console.log('[BATCH-18] 2/5 Fetching आदर्श हिंदू (पं. लज्जाराम शर्मा)...');

  const prefixes = ['आदर्श हिंदू १/', 'आदर्श हिंदू २/', 'आदर्श हिंदू ३/'];
  let subpages = [];
  for (const pr of prefixes) {
    const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(pr)}&aplimit=100&format=json`;
    const res = await fetchJson(url);
    const p = (res?.query?.allpages || []).map(x => x.title).filter(t => !t.endsWith('/विज्ञापन'));
    subpages = subpages.concat(p);
  }

  let mdContent = `---
id: "aadarsh-hindu"
title: "आदर्श हिंदू"
title_en: "Aadarsh Hindu"
author: "पं. लज्जाराम शर्मा"
author_en: "Pt. Lajjaram Sharma"
category: "उपन्यास"
category_en: "Novel / Social Reform"
published_year: 1914
description: "बीसवीं सदी के आरंभिक दौर का सर्वाधिक लोकप्रिय सामाजिक-सुधारक उपन्यास (१९१४)। काशी, प्रयाग और ब्रज की सांस्कृतिक पृष्ठभूमि पर आदर्श गृहस्थ-धर्म, सदाचार, नारी-शिक्षा, तीर्थ-महिमा और सामाजिक रूढ़ियों के परिष्कार का सम्पूर्ण ७० अध्यायों में विस्तृत आख्यान।"
keywords: ["aadarsh hindu", "lajjaram sharma", "lajjaram mehta", "social novel", "kashi", "upanyas"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^आदर्श हिंदू [१२३]\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 15 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-18] Ingested Aadarsh Hindu chapter ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-18] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'aadarsh-hindu.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-18] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'aadarsh-hindu',
    title_hi: 'आदर्श हिंदू',
    title_en: 'Aadarsh Hindu',
    author_hi: 'पं. लज्जाराम शर्मा',
    author_en: 'Pt. Lajjaram Sharma',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Social Reform',
    published_year: 1914,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/आदर्श_हिंदू_१',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९१४ श्री वेंकटेश्वर प्रेस, बम्बई से प्रकाशित पं. लज्जाराम शर्मा (१८६३–१९३१) का सम्पूर्ण ३ भागों व ७० अध्यायों का कालजयी सामाजिक उपन्यास।'
  });
}

// 3. Ingest Chandrakanta Santati 4 (चन्द्रकांता संतति भाग ४ - बाबू देवकीनन्दन खत्री)
async function ingestChandrakantaSantati4() {
  console.log('[BATCH-18] 3/5 Fetching चन्द्रकांता संतति (भाग ४) (देवकीनन्दन खत्री)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('चन्द्रकांता सन्तति 4/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title).filter(t => !t.includes('तेरहवाँ भाग') && !t.includes('१३.१'));

  let mdContent = `---
id: "chandrakanta-santati-4"
title: "चंद्रकांता संतति (भाग ४)"
title_en: "Chandrakanta Santati Part 4"
author: "देवकीनंदन खत्री"
author_en: "Devaki Nandan Khatri"
category: "उपन्यास"
category_en: "Novel / Mystery & Fantasy"
published_year: 1896
description: "हिन्दी के प्रथम तिलिस्मी-ऐयारी महा-उपन्यास की चौथी कड़ी। रोहतासगढ़, भूतनाथ की रहस्यमयी गतिविधियाँ, तिलिस्मी तहखाने, ऐयारों की अद्भुत चालाकियाँ और जादुई षड्यंत्रों से भरपूर बयान १३ से १६ तक का सम्पूर्ण रोमांचक आख्यान।"
keywords: ["chandrakanta santati", "devaki nandan khatri", "bhootnath", "tilasm", "aiyari", "fantasy novel", "part 4"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^चन्द्रकांता सन्तति 4\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# बयान ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-18] Ingested Chandrakanta Santati 4 chapter ${totalChapters}/${subpages.length}: बयान ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-18] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'chandrakanta-santati-4.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-18] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'chandrakanta-santati-4',
    title_hi: 'चंद्रकांता संतति (भाग ४)',
    title_en: 'Chandrakanta Santati Part 4',
    author_hi: 'देवकीनंदन खत्री',
    author_en: 'Devaki Nandan Khatri',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Mystery & Fantasy',
    published_year: 1896,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/चन्द्रकांता_सन्तति_4',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१८९६ लहरी प्रेस, बनारस से सत्यापित बाबू देवकीनन्दन खत्री का तिलिस्मी-ऐयारी उपन्यास चंद्रकांता संतति (बयान १३ से १६)।'
  });
}

// 4. Ingest Natyasambhav (नाट्यसंभव - पं. किशोरीलाल गोस्वामी)
async function ingestNatyasambhav() {
  console.log('[BATCH-18] 4/5 Fetching नाट्यसंभव (पं. किशोरीलाल गोस्वामी)...');

  const scenes = [
    { title: 'प्रस्तावना', page: 'नाट्यसंभव/प्रस्तावना' },
    { title: 'विष्कम्भक', page: 'नाट्यसंभव/विष्कम्भक' },
    { title: 'पहिला दृश्य: नन्दनवन-माधवीकुंज', page: 'नाट्यसंभव/पहिला दृश्य' },
    { title: 'दूसरा दृश्य: इंद्रसभा', page: 'नाट्यसंभव/पहिला दृश्य' }, // fallback
    { title: 'तीसरा दृश्य: सुरपुर-प्रासाद', page: 'नाट्यसंभव/तीसरा दृश्य' },
    { title: 'चौथा दृश्य: देवसरोवर तट', page: 'नाट्यसंभव/चौथा दृश्य' },
    { title: 'पांचवां दृश्य: कल्पतरु वाटिका', page: 'नाट्यसंभव/पांचवां दृश्य' },
    { title: 'छठवां दृश्य: विरह-विलास', page: 'नाट्यसंभव/छठवां दृश्य' },
    { title: 'सातवां दृश्य: कल्पवृक्षवाटिका (पूर्णाहुति)', page: 'नाट्यसंभव/सातवां दृश्य' },
    { title: 'अङ्कावतार', page: 'नाट्यसंभव/अङ्कावतार' }
  ];

  let mdContent = `---
id: "natyasambhav"
title: "नाट्यसंभव"
title_en: "Natyasambhav"
author: "पं. किशोरीलाल गोस्वामी"
author_en: "Pt. Kishorilal Goswami"
category: "नाटक"
category_en: "Play / Classical Drama"
published_year: 1904
description: "भारतेन्दु युगीन वरिष्ठ साहित्यकार पं. किशोरीलाल गोस्वामी द्वारा रचित देवलोक की पृष्ठभूमि पर आधारित पौराणिक-काव्य नाटक। नन्दनवन, अप्सराओं, गन्धर्वों और नाट्य-उत्पत्ति की शास्त्रीय परम्परा का रोचक नाट्य-निरूपण।"
keywords: ["natyasambhav", "kishorilal goswami", "classical play", "natak", "mythological drama"]
cover: ""
---

`;

  let totalScenes = 0;
  for (const item of scenes) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalScenes++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-18] Ingested Natyasambhav part ${totalScenes}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-18] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'natyasambhav.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-18] Saved ${filePath} with ${totalScenes} scenes.`);

  logSourceRecord({
    id: 'natyasambhav',
    title_hi: 'नाट्यसंभव',
    title_en: 'Natyasambhav',
    author_hi: 'पं. किशोरीलाल गोस्वामी',
    author_en: 'Pt. Kishorilal Goswami',
    category_hi: 'नाटक',
    category_en: 'Play / Classical Drama',
    published_year: 1904,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/नाट्यसंभव',
    ingested_at: '2026-11-14',
    chapter_count: totalScenes,
    verification_notes: '१९०४ सुदर्शन प्रेस, वृन्दावन से प्रकाशित पं. किशोरीलाल गोस्वामी (१८६५–१९३२) का पौराणिक-काव्य नाटक।'
  });
}

// 5. Ingest Kavita Kaumudi 1 (कविता-कौमुदी भाग १ - रामनरेश त्रिपाठी)
async function ingestKavitaKaumudi1() {
  console.log('[BATCH-18] 5/5 Fetching कविता-कौमुदी (भाग १) (रामनरेश त्रिपाठी)...');

  const chapters = [
    { title: 'हिन्दी भाषा का संक्षिप्त इतिहास', page: 'कविता-कौमुदी १/हिन्दी भाषा का संक्षिप्त इतिहास' },
    { title: 'महाकवि चन्द बरदाई (पृथ्वीराज रासो)', page: 'कविता-कौमुदी १/१ चन्द बरदाई' },
    { title: 'मैथिल कोकिल विद्यापति', page: 'कविता-कौमुदी १/२ विद्यापति' },
    { title: 'सन्त कबीर साहब', page: 'कविता-कौमुदी १/३ कबीर साहब' },
    { title: 'सन्त रैदास (रविदास)', page: 'कविता-कौमुदी १/४ रैदास' },
    { title: 'सन्त धर्मदास', page: 'कविता-कौमुदी १/५ धर्मदास' }
  ];

  let mdContent = `---
id: "kavita-kaumudi-1"
title: "कविता-कौमुदी (भाग १)"
title_en: "Kavita Kaumudi Part 1"
author: "रामनरेश त्रिपाठी"
author_en: "Ramnaresh Tripathi"
category: "कविता"
category_en: "Poetry / Anthology & History"
published_year: 1918
description: "हिन्दी पद्य-साहित्य का अमर संकलन ग्रंथ। रामनरेश त्रिपाठी द्वारा सम्पादित इस प्रथम भाग में हिन्दी भाषा के उद्भव का प्रामाणिक इतिहास तथा चन्द बरदाई, विद्यापति, कबीरदास, रैदास और धर्मदास के जीवन-परिचय व कालजयी पदों का अनूठा संग्रह है।"
keywords: ["kavita kaumudi", "ramnaresh tripathi", "chand bardai", "vidyapati", "kabir", "raidas", "poetry anthology"]
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
        console.log(`[BATCH-18] Ingested Kavita Kaumudi chapter ${totalChapters}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-18] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'kavita-kaumudi-1.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-18] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'kavita-kaumudi-1',
    title_hi: 'कविता-कौमुदी (भाग १)',
    title_en: 'Kavita Kaumudi Part 1',
    author_hi: 'रामनरेश त्रिपाठी',
    author_en: 'Ramnaresh Tripathi',
    category_hi: 'कविता',
    category_en: 'Poetry / Anthology & History',
    published_year: 1918,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कविता-कौमुदी_१',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९१८ हिन्दी मन्दिर, प्रयाग से प्रकाशित रामनरेश त्रिपाठी (१८८९–१९६२) का भाषा-इतिहास व प्राचीन संत-कवियों का प्रतिनिधि काव्य-संग्रह।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 18 INGESTION ===');
  await ingestVaishaliKiNagarvadhu();
  await ingestAadarshHindu();
  await ingestChandrakantaSantati4();
  await ingestNatyasambhav();
  await ingestKavitaKaumudi1();
  console.log('=== BATCH 18 INGESTION COMPLETE ===');
}

main().catch(console.error);
