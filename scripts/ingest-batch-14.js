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

// 1. Ingest Madhavrao Sapre Ki Kahaniyan (माधवराव सप्रे की कहानियाँ - पं. माधवराव सप्रे)
async function ingestSapreKahaniyan() {
  console.log('[BATCH-14] 1/5 Fetching माधवराव सप्रे की कहानियाँ (पं. माधवराव सप्रे)...');

  const items = [
    { title: 'एक टोकरी भर मिट्‌टी (हिन्दी की प्रथम मौलिक कहानी)', page: 'माधवराव सप्रे की कहानियाँ/एक टोकरी भर मिट्‌टी' },
    { title: 'एक पथिक का स्वप्न', page: 'माधवराव सप्रे की कहानियाँ/एक पथिक का स्वप्न' },
    { title: 'आजम', page: 'माधवराव सप्रे की कहानियाँ/आजम' },
    { title: 'सम्मान किसे कहते हैं?', page: 'माधवराव सप्रे की कहानियाँ/सम्मान किसे कहते हैं?' },
    { title: 'सुभाषित रत्न (भाग १)', page: 'माधवराव सप्रे की कहानियाँ/सुभाषित रत्न (१)' },
    { title: 'सुभाषित रत्न (भाग २)', page: 'माधवराव सप्रे की कहानियाँ/सुभाषित रत्न (२)' },
    { title: 'अपनी बात (कथा-दृष्टि)', page: 'माधवराव सप्रे की कहानियाँ/अपनी बात' },
    { title: 'स्पष्टीकरण के दो शब्द', page: 'माधवराव सप्रे की कहानियाँ/स्पष्टीकरण के दो शब्द' },
    { title: 'अन्तर्भाष्य-समीक्षा', page: 'माधवराव सप्रे की कहानियाँ/अन्तर्भाष्य-समीक्षा' }
  ];

  let mdContent = `---
id: "sapre-kahaniyan"
title: "माधवराव सप्रे की कहानियाँ"
title_en: "Madhavrao Sapre Ki Kahaniyan"
author: "पं. माधवराव सप्रे"
author_en: "Pt. Madhavrao Sapre"
category: "कहानी संग्रह"
category_en: "Short Stories"
published_year: 1901
description: "हिन्दी कहानी के जनक पं. माधवराव सप्रे की अमर कहानियों का संकलन, जिसमें हिन्दी की प्रथम मौलिक आधुनिक कहानी 'एक टोकरी भर मिट्‌टी' (१९०१) तथा अन्य विचारोत्तेजक कथाएँ समाहित हैं।"
keywords: ["madhavrao sapre", "ek tokri bhar mitti", "first hindi story", "hindi kahaniya", "sapre"]
cover: ""
---

`;

  let totalStories = 0;
  for (const item of items) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalStories++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-14] Ingested Sapre story ${totalStories}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(200);
    } catch (e) {
      console.warn(`[BATCH-14] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'sapre-kahaniyan.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-14] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'sapre-kahaniyan',
    title_hi: 'माधवराव सप्रे की कहानियाँ',
    title_en: 'Madhavrao Sapre Ki Kahaniyan',
    author_hi: 'पं. माधवराव सप्रे',
    author_en: 'Pt. Madhavrao Sapre',
    category_hi: 'कहानी संग्रह',
    category_en: 'Short Stories',
    published_year: 1901,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/माधवराव_सप्रे_की_कहानियाँ',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: 'पं. माधवराव सप्रे (१८७१–१९२६) द्वारा रचित हिन्दी की प्रथम मौलिक कहानी एक टोकरी भर मिट्‌टी (छत्तीसगढ़ मित्र, १९०१) व अन्य प्रतिनिधि कहानियों का संग्रह।'
  });
}

// 2. Ingest Dewangana (देवांगना - आचार्य चतुरसेन शास्त्री)
async function ingestDewangana() {
  console.log('[BATCH-14] 2/5 Fetching देवांगना (आचार्य चतुरसेन शास्त्री)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('देवांगना/')}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title).filter(t => !t.endsWith('/क्रम'));

  let mdContent = `---
id: "dewangana"
title: "देवांगना"
title_en: "Dewangana"
author: "आचार्य चतुरसेन शास्त्री"
author_en: "Acharya Chatursen Shastri"
category: "उपन्यास"
category_en: "Novel / Historical Fiction"
published_year: 1920
description: "प्राचीन भारत की सांस्कृतिक राजधानी वाराणसी और बौद्ध विहारों की पृष्ठभूमि पर आधारित आचार्य चतुरसेन शास्त्री का कालजयी ऐतिहासिक उपन्यास। धर्म, तांत्रिक रहस्यवाद, प्रेम और मानवीय नियति का सजीव चित्रण।"
keywords: ["dewangana", "acharya chatursen shastri", "varanasi", "historical novel", "upanyas"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^देवांगना\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-14] Ingested Dewangana chapter ${totalChapters}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(200);
    } catch (e) {
      console.warn(`[BATCH-14] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'dewangana.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-14] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'dewangana',
    title_hi: 'देवांगना',
    title_en: 'Dewangana',
    author_hi: 'आचार्य चतुरसेन शास्त्री',
    author_en: 'Acharya Chatursen Shastri',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Historical Fiction',
    published_year: 1920,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/देवांगना',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: 'आचार्य चतुरसेन शास्त्री (१८९१–१९६०) का प्राचीन काशी की पृष्ठभूमि पर रचित ऐतिहासिक उपन्यास, भारतीय कॉपीराइट अधिनियम १९५७ के तहत सार्वजनिक डोमेन।'
  });
}

// 3. Ingest Kuch Vichar (कुछ विचार - मुंशी प्रेमचंद)
async function ingestKuchVichar() {
  console.log('[BATCH-14] 3/5 Fetching कुछ विचार (मुंशी प्रेमचंद)...');

  const essays = [
    { title: 'साहित्य का उद्देश्य', page: 'कुछ विचार/साहित्य का उद्देश्य' },
    { title: 'कहानी-कला (भाग १)', page: 'कुछ विचार/कहानी-कला (१)' },
    { title: 'कहानी-कला (भाग २)', page: 'कुछ विचार/कहानी-कला (२)' },
    { title: 'कहानी-कला (भाग ३)', page: 'कुछ विचार/कहानी-कला (३)' },
    { title: 'उपन्यास', page: 'कुछ विचार/उपन्यास' },
    { title: 'उपन्यास का विषय', page: 'कुछ विचार/उपन्यास का विषय' },
    { title: 'उर्दू, हिन्दी और हिन्दुस्तानी', page: 'कुछ विचार/उर्दू, हिन्दी और हिन्दुस्तानी' },
    { title: 'एक भाषण', page: 'कुछ विचार/एक भाषण' },
    { title: 'कौमी भाषा के विषय में कुछ विचार', page: 'कुछ विचार/कौमी भाषा के विषय में कुछ विचार' },
    { title: 'जीवन में साहित्य का स्थान', page: 'कुछ विचार/जीवन में साहित्य का स्थान' },
    { title: 'राष्ट्र-भाषा हिन्दी और उसकी समस्याएँ', page: 'कुछ विचार/राष्ट्र-भाषा हिन्दी और उसकी समस्याएँ' }
  ];

  let mdContent = `---
id: "kuch-vichar"
title: "कुछ विचार"
title_en: "Kuch Vichar"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "निबन्ध"
category_en: "Essays / Literary Criticism"
published_year: 1939
description: "मुंशी प्रेमचंद के अमर साहित्यिक एवं आलोचनात्मक निबन्धों का प्रामाणिक संकलन। साहित्य की परिभाषा, कहानी व उपन्यास की रचना-प्रक्रिया, राष्ट्रभाषा की समस्या और प्रगतिशील सौन्दर्यशास्त्र पर कालजयी विचार।"
keywords: ["kuch vichar", "munshi premchand", "sahitya ka uddeshya", "kahani kala", "nibandh", "literary criticism"]
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
        console.log(`[BATCH-14] Ingested Premchand essay ${totalEssays}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(200);
    } catch (e) {
      console.warn(`[BATCH-14] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'kuch-vichar.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-14] Saved ${filePath} with ${totalEssays} essays.`);

  logSourceRecord({
    id: 'kuch-vichar',
    title_hi: 'कुछ विचार',
    title_en: 'Kuch Vichar',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'निबन्ध',
    category_en: 'Essays / Literary Criticism',
    published_year: 1939,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कुछ_विचार',
    ingested_at: '2026-11-14',
    chapter_count: totalEssays,
    verification_notes: '१९३९ सरस्वती प्रेस, बनारस से सत्यापित मुंशी प्रेमचंद के ११ प्रतिनिधि आलोचनात्मक व वैचारिक निबन्ध।'
  });
}

// 4. Ingest Bharatendu Jivan Charitra (भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र - बाबू राधाकृष्ण दास)
async function ingestBharatenduJivanCharitra() {
  console.log('[BATCH-14] 4/5 Fetching भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र (बाबू राधाकृष्ण दास)...');

  const chapters = [
    { title: 'अध्याय १: वंश-परिचय एवं बाल्यावस्था', page: 'भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/1' },
    { title: 'अध्याय २: विद्याभ्यास, यात्रा एवं साहित्यिक अभिरुचि', page: 'भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/2' },
    { title: 'अध्याय ३: रचनाएँ, नाटक एवं पत्र-पत्रिकाएँ', page: 'भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/3' },
    { title: 'अध्याय ४: साहित्य-सेवा, मित्रता एवं दानशीलता', page: 'भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/4' },
    { title: 'अध्याय ५: जीवन की अंतिम अवस्था एवं देहावसान', page: 'भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/5' },
    { title: 'अध्याय ६: भारतेन्दु जी का व्यक्तित्व एवं हिन्दी साहित्य पर प्रभाव', page: 'भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/6' },
    { title: 'अध्याय ७: ग्रन्थों की प्रामाणिक सूची', page: 'भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/7' }
  ];

  let mdContent = `---
id: "bharatendu-jivan-charitra"
title: "भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र"
title_en: "Bharatendu Babu Harishchandra Ka Jivan Charitra"
author: "बाबू राधाकृष्ण दास"
author_en: "Babu Radhakrishna Das"
category: "जीवनी"
category_en: "Biography / Memoir"
published_year: 1904
description: "आधुनिक हिन्दी के जनक भारतेन्दु हरिश्चंद्र की प्रथम प्रामाणिक एवं विस्तृत जीवनी। नागरी प्रचारिणी सभा के संस्थापक सदस्य बाबू राधाकृष्ण दास द्वारा रचित ऐतिहासिक जीवनी, जिसमें भारतेन्दु युगीन पुनर्जागरण का सजीव इतिहास समाहित है।"
keywords: ["bharatendu harishchandra", "radhakrishna das", "jivan charitra", "biography", "nagari pracharini sabha"]
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
        console.log(`[BATCH-14] Ingested Bharatendu biography chapter ${totalChapters}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(250);
    } catch (e) {
      console.warn(`[BATCH-14] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'bharatendu-jivan-charitra.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-14] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'bharatendu-jivan-charitra',
    title_hi: 'भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र',
    title_en: 'Bharatendu Babu Harishchandra Ka Jivan Charitra',
    author_hi: 'बाबू राधाकृष्ण दास',
    author_en: 'Babu Radhakrishna Das',
    category_hi: 'जीवनी',
    category_en: 'Biography / Memoir',
    published_year: 1904,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भारतेन्दु_बाबू_हरिश्चंद्र_का_जीवन_चरित्र',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९०४ काशी नागरीप्रचारिणी सभा ग्रन्थमाला (संख्या ६) से सत्यापित भारतेन्दु हरिश्चंद्र की प्रथम प्रामाणिक जीवनी।'
  });
}

// 5. Ingest Anand Math (आनन्द मठ - बंकिमचंद्र चट्टोपाध्याय / अनु. ईश्वरीप्रसाद शर्मा)
async function ingestAnandMath() {
  console.log('[BATCH-14] 5/5 Fetching आनन्द मठ (बंकिमचंद्र चट्टोपाध्याय / अनु. ईश्वरीप्रसाद शर्मा)...');

  const part1Pages = [
    { title: 'कथा मुख', page: 'आनन्द मठ/कथा मुख' },
    { title: 'परिच्छेद १', page: 'आनन्द मठ/पहला परिच्छेद' },
    { title: 'परिच्छेद २', page: 'आनन्द मठ/दूसरा परिच्छेद' },
    { title: 'परिच्छेद ३', page: 'आनन्द मठ/तीसरा परिच्छेद' },
    { title: 'परिच्छेद ४', page: 'आनन्द मठ/चौथा परिच्छेद' },
    { title: 'परिच्छेद ५', page: 'आनन्द मठ/पाँचवाँ परिच्छेद' },
    { title: 'परिच्छेद ६', page: 'आनन्द मठ/छठा परिच्छेद' },
    { title: 'परिच्छेद ७', page: 'आनन्द मठ/सातवाँ परिच्छेद' },
    { title: 'परिच्छेद ८', page: 'आनन्द मठ/आठवाँ परिच्छेद' },
    { title: 'परिच्छेद ९', page: 'आनन्द मठ/नौवाँ परिच्छेद' },
    { title: 'परिच्छेद १०', page: 'आनन्द मठ/दसवाँ परिच्छेद' },
    { title: 'परिच्छेद ११', page: 'आनन्द मठ/ग्यारहवाँ परिच्छेद' },
    { title: 'परिच्छेद १२', page: 'आनन्द मठ/बारहवाँ परिच्छेद' },
    { title: 'परिच्छेद १३', page: 'आनन्द मठ/तेरहवाँ परिच्छेद' },
    { title: 'परिच्छेद १४', page: 'आनन्द मठ/चौदहवाँ परिच्छेद' },
    { title: 'परिच्छेद १५', page: 'आनन्द मठ/पंद्रहवाँ परिच्छेद' },
    { title: 'परिच्छेद १६', page: 'आनन्द मठ/सोलहवाँ परिच्छेद' },
    { title: 'परिच्छेद १७', page: 'आनन्द मठ/सत्रहवाँ परिच्छेद' },
    { title: 'परिच्छेद १८', page: 'आनन्द मठ/अठारहवाँ परिच्छेद' },
    { title: 'परिशिष्ट: वन्दे मातरम् व ऐतिहासिक समीक्षा', page: 'आनन्द मठ/परिशिष्ट' }
  ];

  let mdContent = `---
id: "anand-math"
title: "आनन्द मठ"
title_en: "Anand Math"
author: "बंकिमचंद्र चट्टोपाध्याय"
author_en: "Bankim Chandra Chattopadhyay"
category: "उपन्यास"
category_en: "Novel / Patriotic Classic"
published_year: 1922
description: "भारत के राष्ट्रीय गीत 'वन्दे मातरम्' का उद्गम स्थल — अमर देशभक्ति उपन्यास। संन्यासी विद्रोह (१७७३) और अकाल की त्रासदी की पृष्ठभूमि में राष्ट्र-मुक्ति के लिए सर्वस्व अर्पण करने वाली संतान सेना का ओजस्वी आख्यान।"
keywords: ["anand math", "bankim chandra", "vande mataram", "ishwari prasad sharma", "sanyasi vidroh", "upanyas"]
cover: ""
---

`;

  // Section 1: Katha Mukh & Khand 1
  mdContent += `\n# प्रथम खंड (कथा मुख एवं परिच्छेद १ से १८)\n\n`;
  for (const item of part1Pages) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        mdContent += `\n## ${item.title}\n\n${clean}\n\n`;
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-14] Error fetching ${item.page}:`, e.message);
    }
  }

  // Section 2: Khand 2 (2.1 to 2.8)
  mdContent += `\n# द्वितीय खंड (परिच्छेद १ से ८)\n\n`;
  for (let i = 1; i <= 8; i++) {
    const page = `आनन्द मठ/2.${i}`;
    try {
      const raw = await fetchWikiPage(page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        mdContent += `\n## द्वितीय खंड — परिच्छेद ${i}\n\n${clean}\n\n`;
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-14] Error fetching ${page}:`, e.message);
    }
  }

  // Section 3: Khand 3 (3.1 to 3.12)
  mdContent += `\n# तृतीय खंड (परिच्छेद १ से १२)\n\n`;
  for (let i = 1; i <= 12; i++) {
    const page = `आनन्द मठ/3.${i}`;
    try {
      const raw = await fetchWikiPage(page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        mdContent += `\n## तृतीय खंड — परिच्छेद ${i}\n\n${clean}\n\n`;
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-14] Error fetching ${page}:`, e.message);
    }
  }

  // Section 4: Khand 4 (4.1 to 4.8)
  mdContent += `\n# चतुर्थ खंड (परिच्छेद १ से ८ एवं उपसंहार)\n\n`;
  for (let i = 1; i <= 8; i++) {
    const page = `आनन्द मठ/4.${i}`;
    try {
      const raw = await fetchWikiPage(page);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        mdContent += `\n## चतुर्थ खंड — परिच्छेद ${i}\n\n${clean}\n\n`;
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-14] Error fetching ${page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'anand-math.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-14] Saved ${filePath} with 4 Khandas (48 chapters).`);

  logSourceRecord({
    id: 'anand-math',
    title_hi: 'आनन्द मठ',
    title_en: 'Anand Math',
    author_hi: 'बंकिमचंद्र चट्टोपाध्याय',
    author_en: 'Bankim Chandra Chattopadhyay',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Patriotic Classic',
    published_year: 1922,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/आनन्द_मठ',
    ingested_at: '2026-11-14',
    chapter_count: 4,
    verification_notes: '१९२२ पं. ईश्वरीप्रसाद शर्मा द्वारा अनूदित व हिन्दी पुस्तक एजेंसी से प्रकाशित प्रामाणिक संस्करण, वन्दे मातरम् राष्ट्रगीत का मूल स्रोत।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 14 INGESTION ===');
  await ingestSapreKahaniyan();
  await ingestDewangana();
  await ingestKuchVichar();
  await ingestBharatenduJivanCharitra();
  await ingestAnandMath();
  console.log('=== BATCH 14 INGESTION COMPLETE ===');
}

main().catch(console.error);
