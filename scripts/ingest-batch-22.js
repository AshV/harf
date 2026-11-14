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

function cleanBatch22Text(text) {
  if (!text) return '';
  let cleaned = text;

  // Remove multi-line navigation headers at start
  while (true) {
    const next = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|पीछे|मुखपृष्ठ|मुख्यपृष्ठ|भूमिका|अगला भाग|अगला अध्याय|पिछला अध्याय|\(\d{4}\)|अणिमा|लेखाञ्जलि|मेघदूत|भक्तभावन|कविवचनसुधा)[^\n]*?\n+/i, '');
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

// 1. Ingest Anima (अणिमा - सूर्यकांत त्रिपाठी 'निराला')
async function ingestAnima() {
  console.log('[BATCH-22] 1/5 Fetching अणिमा (सूर्यकांत त्रिपाठी निराला)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('अणिमा/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const subA = a.replace(/^अणिमा\//, '').trim();
    const subB = b.replace(/^अणिमा\//, '').trim();
    const mA = subA.match(/^([०-९\d]+)/);
    const mB = subB.match(/^([०-९\d]+)/);
    const nA = mA ? devanagariToNumber(mA[1]) : 999;
    const nB = mB ? devanagariToNumber(mB[1]) : 999;
    return nA - nB;
  });

  let mdContent = `---
id: "anima"
title: "अणिमा"
title_en: "Anima"
author: "सूर्यकांत त्रिपाठी 'निराला'"
author_en: "Suryakant Tripathi 'Nirala'"
category: "कविता"
category_en: "Poetry / Chhayavadi & Progressive Verse"
published_year: 1943
description: "महाप्राण सूर्यकान्त त्रिपाठी 'निराला' का सुप्रसिद्ध काव्य-संग्रह। 'स्नेह निर्झर बह गया है', 'मैं अकेला', महादेवी वर्मा व प्रसाद जी के प्रति श्रद्धा-कविताएँ तथा रहस्यवादी, प्रगतिशील व मानवीय संवेदनाओं से ओत-प्रोत ४५ कालजयी रचनाओं का संकलन।"
keywords: ["anima", "nirala", "suryakant tripathi nirala", "hindi kavita", "chhayavad", "geeti kavya"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^अणिमा\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch22Text(cleanWikiHtml(raw));
      if (clean.length > 20) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-22] Ingested Anima poem ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(100);
    } catch (e) {
      console.warn(`[BATCH-22] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'anima.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-22] Saved ${filePath} with ${totalChapters} poems.`);

  logSourceRecord({
    id: 'anima',
    title_hi: 'अणिमा',
    title_en: 'Anima',
    author_hi: "सूर्यकांत त्रिपाठी 'निराला'",
    author_en: "Suryakant Tripathi 'Nirala'",
    category_hi: 'कविता',
    category_en: 'Poetry / Chhayavadi & Progressive Verse',
    published_year: 1943,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/अणिमा',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: "१९४३ युग-मन्दिर, उन्नाव / लखनऊ से प्रकाशित महाप्राण सूर्यकांत त्रिपाठी 'निराला' (१८९९–१९६१) का सम्पूर्ण ४५ कविताओं का प्रामाणिक संग्रह।"
  });
}

// 2. Ingest Lekhanjali (लेखाञ्जलि - आचार्य महावीर प्रसाद द्विवेदी)
async function ingestLekhanjali() {
  console.log('[BATCH-22] 2/5 Fetching लेखाञ्जलि (आचार्य महावीर प्रसाद द्विवेदी)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('लेखाञ्जलि/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const subA = a.replace(/^लेखाञ्जलि\//, '').trim();
    const subB = b.replace(/^लेखाञ्जलि\//, '').trim();
    const mA = subA.match(/^([०-९\d]+)/);
    const mB = subB.match(/^([०-९\d]+)/);
    const nA = mA ? devanagariToNumber(mA[1]) : 999;
    const nB = mB ? devanagariToNumber(mB[1]) : 999;
    return nA - nB;
  });

  let mdContent = `---
id: "lekhanjali"
title: "लेखाञ्जलि"
title_en: "Lekhanjali"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "निबंध व विमर्श"
category_en: "Essays / Science, History & Society"
published_year: 1928
description: "द्विवेदी युग के युगप्रवर्तक आचार्य महावीर प्रसाद द्विवेदी द्वारा रचित वैचारिक व ज्ञानवर्धक निबंधों का संग्रह। सौर जगत की उत्पत्ति, प्राचीन जन्तु, उत्तरी ध्रुव व एस्किमो जाति, आगरे की इमारतें तथा राष्ट्रीय-शैक्षणिक विषयों पर १९ उत्कृष्ट गद्य-रचनाएँ।"
keywords: ["lekhanjali", "mahavir prasad dwivedi", "hindi nibandh", "scientific essays", "dwivedi yug"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^लेखाञ्जलि\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanBatch22Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-22] Ingested Lekhanjali essay ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-22] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'lekhanjali.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-22] Saved ${filePath} with ${totalChapters} essays.`);

  logSourceRecord({
    id: 'lekhanjali',
    title_hi: 'लेखाञ्जलि',
    title_en: 'Lekhanjali',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'निबंध व विमर्श',
    category_en: 'Essays / Science, History & Society',
    published_year: 1928,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/लेखाञ्जलि',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२८ हिंदी पुस्तक एजेंसी, कलकत्ता से प्रकाशित आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) का १९ ज्ञानवर्धक एवं वैज्ञानिक निबंधों का संग्रह।'
  });
}

// 3. Ingest Meghdoot (मेघदूत - महाकवि कालिदास / आचार्य महावीर प्रसाद द्विवेदी)
async function ingestMeghdoot() {
  console.log('[BATCH-22] 3/5 Fetching मेघदूत (महावीर प्रसाद द्विवेदी)...');

  const subpages = [
    { title: 'मेघदूत का हिन्दी-गद्य में भावार्थ-बोधक अनुवाद/१', label: 'पूर्वमेघ (पूर्वार्द्ध)' },
    { title: 'मेघदूत का हिन्दी-गद्य में भावार्थ-बोधक अनुवाद/२', label: 'उत्तरमेघ (उत्तरार्द्ध)' },
    { title: 'मेघदूत का हिन्दी-गद्य में भावार्थ-बोधक अनुवाद/३', label: 'उपसंहार व विमर्श' }
  ];

  let mdContent = `---
id: "meghdoot"
title: "मेघदूत"
title_en: "Meghaduta (Hindi Exposition)"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "कविता"
category_en: "Classical Sanskrit Epic & Translation"
published_year: 1924
description: "महाकवि कालिदास के विश्वविख्यात खंडकाव्य 'मेघदूत' का आचार्य महावीर प्रसाद द्विवेदी द्वारा रचित सम्पूर्ण भावार्थ-बोधक गद्यानुवाद। रामगिरि से अलकापुरी तक का मेघ-संदेश, पूर्वमेघ और उत्तरमेघ का अत्यंत सरस एवं भावपूर्ण प्रवाह।"
keywords: ["meghdoot", "kalidasa", "mahavir prasad dwivedi", "meghaduta", "sanskrit classic", "alaka", "yaksha"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of subpages) {
    try {
      const raw = await fetchWikiPage(item.title);
      const clean = cleanBatch22Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.label}\n\n${clean}\n\n`;
        console.log(`[BATCH-22] Ingested Meghdoot chapter ${totalChapters}/${subpages.length}: ${item.label} (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-22] Error fetching ${item.title}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'meghdoot.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-22] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'meghdoot',
    title_hi: 'मेघदूत',
    title_en: 'Meghaduta (Hindi Exposition)',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'कविता',
    category_en: 'Classical Sanskrit Epic & Translation',
    published_year: 1924,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/मेघदूत_का_हिन्दी-गद्य_में_भावार्थ-बोधक_अनुवाद',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२४ इंडियन प्रेस लिमिटेड, इलाहाबाद से प्रकाशित आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा महाकवि कालिदास के मेघदूत का सम्पूर्ण भावार्थ-बोधक गद्यानुवाद।'
  });
}

// 4. Ingest Bhaktabhavan (भक्तभावन - महाकवि ग्वाल)
async function ingestBhaktabhavan() {
  console.log('[BATCH-22] 4/5 Fetching भक्तभावन (महाकवि ग्वाल)...');

  const canonicalOrder = [
    { page: 'भक्तभावन/भूमिका', title: 'भूमिका व मंगलाचरण' },
    { page: 'भक्तभावन/यमुना लहरी', title: 'यमुना लहरी' },
    { page: 'भक्तभावन/कृष्णचंद्रजू के नखशिख', title: 'कृष्णचंद्रजू के नखशिख' },
    { page: 'भक्तभावन/गोपी पचीसी', title: 'गोपी पचीसी' },
    { page: 'भक्तभावन/कृष्ण प्रति गोपिन को पत्री', title: 'कृष्ण प्रति गोपिन को पत्री' },
    { page: 'भक्तभावन/षट्ऋतु वर्णन', title: 'षट्ऋतु वर्णन' },
    { page: 'भक्तभावन/कृष्णाष्टक', title: 'कृष्णाष्टक' },
    { page: 'भक्तभावन/राधाष्टक', title: 'राधाष्टक' },
    { page: 'भक्तभावन/दशमहाविज्ञान की स्तुति', title: 'दशमहाविज्ञान की स्तुति' },
    { page: 'भक्तभावन/ज्वालाष्टक', title: 'ज्वालाष्टक' },
    { page: 'भक्तभावन/अन्योक्ति', title: 'अन्योक्ति' },
    { page: 'भक्तभावन/प्रस्तावक नीति', title: 'प्रस्तावक नीति' }
  ];

  let mdContent = `---
id: "bhaktabhavan"
title: "भक्तभावन"
title_en: "Bhakta-Bhavan"
author: "कवि ग्वाल"
author_en: "Kavi Gwal"
category: "कविता"
category_en: "Classical Braj Bhasha Devotional Poetry"
published_year: 1860
description: "रीतिकाल के प्रसिद्ध महाकवि ग्वाल (१७९१–१८६७) का भक्ति एवं शृंगार-रस से परिपूर्ण कालजयी ग्रंथ। यमुना लहरी, गोपी पचीसी, कृष्ण-नखशिख, षट्ऋतु वर्णन, कृष्णाष्टक, राधाष्टक व अन्योक्ति सहित सम्पूर्ण १२ अध्यायों का वृहत् काव्य-संग्रह।"
keywords: ["bhaktabhavan", "gwal kavi", "braj bhasha", "yamuna lahari", "riti kavya", "krishna bhakti"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of canonicalOrder) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch22Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-22] Ingested Bhaktabhavan chapter ${totalChapters}/${canonicalOrder.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-22] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'bhaktabhavan.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-22] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'bhaktabhavan',
    title_hi: 'भक्तभावन',
    title_en: 'Bhakta-Bhavan',
    author_hi: 'कवि ग्वाल',
    author_en: 'Kavi Gwal',
    category_hi: 'कविता',
    category_en: 'Classical Braj Bhasha Devotional Poetry',
    published_year: 1860,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भक्तभावन',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: 'रीतिकाल के महाकवि ग्वाल (१७९१–१८६७) का यमुना लहरी, गोपी पचीसी, नखशिख व षट्ऋतु वर्णन सहित सम्पूर्ण १२ अध्यायों का ब्रजभाषा भक्ति-काव्य।'
  });
}

// 5. Ingest Kavivachansudha (कविवचनसुधा - भारतेन्दु हरिश्चंद्र)
async function ingestKavivachansudha() {
  console.log('[BATCH-22] 5/5 Fetching कविवचनसुधा (भारतेन्दु हरिश्चंद्र)...');

  const raw = await fetchWikiPage('कविवचनसुधा');
  const clean = cleanBatch22Text(cleanWikiHtml(raw));

  const lines = clean.split('\n');

  // Find partition points discovered in structural inspection
  let part1Lines = [];
  let part2Lines = [];
  let part3Lines = [];
  let part4Lines = [];
  let part5Lines = [];

  for (let i = 0; i < lines.length; i++) {
    if (i < 477) part1Lines.push(lines[i]);
    else if (i < 931) part2Lines.push(lines[i]);
    else if (i < 1269) part3Lines.push(lines[i]);
    else if (i < 1406) part4Lines.push(lines[i]);
    else part5Lines.push(lines[i]);
  }

  const chapters = [
    { title: 'मंगलाचरण व वीर-काव्य', text: part1Lines.join('\n').trim() },
    { title: 'मनहरण, सवैया व शृंगार', text: part2Lines.join('\n').trim() },
    { title: 'स्तुति, पद व नीति', text: part3Lines.join('\n').trim() },
    { title: 'अलिफनामा (आध्यात्मिक काव्य)', text: part4Lines.join('\n').trim() },
    { title: 'पावस-कवित्त, विरह व दोहावली', text: part5Lines.join('\n').trim() }
  ];

  let mdContent = `---
id: "kavivachansudha"
title: "कविवचनसुधा"
title_en: "Kavi Vachan Sudha"
author: "भारतेन्दु हरिश्चंद्र"
author_en: "Bharatendu Harishchandra"
category: "कविता"
category_en: "Poetry / Classical & Patriotic Anthology"
published_year: 1906
description: "भारतेन्दु हरिश्चंद्र द्वारा संस्थापित युगान्तकारी पत्रिका 'कविवचनसुधा' से संकलित ऐतिहासिक काव्य-संग्रह। भारतेन्दु युग के भक्ति, वीर-रस, शृंगार, नीति, पावस-कवित्त, अलिफनामा तथा दोहावली का ५ विस्तृत खंडों में ८०,००० से अधिक अक्षरों का वृहत् काव्यात्मक संकलन।"
keywords: ["kavivachansudha", "bharatendu harishchandra", "kavi vachan sudha", "hindi poetry", "braj bhasha", "bharatendu yug"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const ch of chapters) {
    if (ch.text.length > 50) {
      totalChapters++;
      mdContent += `\n# ${ch.title}\n\n${ch.text}\n\n`;
      console.log(`[BATCH-22] Ingested Kavivachansudha section ${totalChapters}/${chapters.length}: ${ch.title} (${ch.text.length} chars)`);
    }
  }

  const filePath = path.join(RAW_DIR, 'kavivachansudha.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-22] Saved ${filePath} with ${totalChapters} sections.`);

  logSourceRecord({
    id: 'kavivachansudha',
    title_hi: 'कविवचनसुधा',
    title_en: 'Kavi Vachan Sudha',
    author_hi: 'भारतेन्दु हरिश्चंद्र',
    author_en: 'Bharatendu Harishchandra',
    category_hi: 'कविता',
    category_en: 'Poetry / Classical & Patriotic Anthology',
    published_year: 1906,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कविवचनसुधा',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९०६ (भारतजीवन प्रेस, काशी) से प्रकाशित भारतेन्दु हरिश्चंद्र (१८५०–१८८५) की सुप्रसिद्ध पत्रिका से संकलित ५ खंडों का वृहत् काव्य-संग्रह।'
  });
}

async function runBatch22() {
  console.log('=== STARTING BATCH 22 INGESTION ===');
  await ingestAnima();
  await ingestLekhanjali();
  await ingestMeghdoot();
  await ingestBhaktabhavan();
  await ingestKavivachansudha();
  console.log('=== COMPLETED BATCH 22 INGESTION ===');
}

runBatch22().catch(console.error);
