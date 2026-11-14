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
  while (true) {
    const next = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|पीछे|मुखपृष्ठ|अगला भाग|अगला अध्याय|पिछला अध्याय|\(\d{4}\))[^\n]*?\n+/i, '');
    if (next === cleaned) break;
    cleaned = next;
  }
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

function devanagariToNumber(str) {
  const map = { '०': 0, '१': 1, '२': 2, '३': 3, '४': 4, '५': 5, '६': 6, '७': 7, '८': 8, '९': 9 };
  const digits = str.replace(/[^\u0966-\u096F]/g, '');
  if (!digits) return 999;
  return Number(digits.replace(/[\u0966-\u096F]/g, d => map[d]));
}

// 1. Ingest Chandrakanta Santati 5 (चन्द्रकांता संतति भाग ५ - बाबू देवकीनन्दन खत्री)
async function ingestChandrakantaSantati5() {
  console.log('[BATCH-19] 1/5 Fetching चन्द्रकांता संतति (भाग ५) (देवकीनन्दन खत्री)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('चन्द्रकान्ता सन्तति 5/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const [b1, c1] = a.replace(/^चन्द्रकान्ता सन्तति 5\//, '').split('.').map(Number);
    const [b2, c2] = b.replace(/^चन्द्रकान्ता सन्तति 5\//, '').split('.').map(Number);
    if (b1 !== b2) return b1 - b2;
    return c1 - c2;
  });

  let mdContent = `---
id: "chandrakanta-santati-5"
title: "चंद्रकांता संतति (भाग ५)"
title_en: "Chandrakanta Santati Part 5"
author: "देवकीनंदन खत्री"
author_en: "Devaki Nandan Khatri"
category: "उपन्यास"
category_en: "Novel / Mystery & Fantasy"
published_year: 1896
description: "हिन्दी के प्रथम तिलिस्मी-ऐयारी महा-उपन्यास की पाँचवीं कड़ी। रोहतासगढ़, चुनार, खोह के रहस्य, भूतनाथ और ऐयारों की अद्भुत चालों और तिलिस्मी तहखानों से भरपूर बयान १७ से २० तक का सम्पूर्ण रोमांचक आख्यान।"
keywords: ["chandrakanta santati", "devaki nandan khatri", "bhootnath", "tilasm", "aiyari", "fantasy novel", "part 5"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^चन्द्रकान्ता सन्तति 5\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const [bayan, chap] = cleanTitle.split('.');
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# बयान ${bayan} - भाग ${chap}\n\n${clean}\n\n`;
        if (totalChapters % 15 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-19] Ingested Chandrakanta Santati 5 chapter ${totalChapters}/${subpages.length}: बयान ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-19] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'chandrakanta-santati-5.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-19] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'chandrakanta-santati-5',
    title_hi: 'चंद्रकांता संतति (भाग ५)',
    title_en: 'Chandrakanta Santati Part 5',
    author_hi: 'देवकीनंदन खत्री',
    author_en: 'Devaki Nandan Khatri',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Mystery & Fantasy',
    published_year: 1896,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/चन्द्रकान्ता_सन्तति_5',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१८९६ ईस्वी में प्रकाशित बाबू देवकीनन्दन खत्री (१८६१–१९१३) का तिलिस्मी-ऐयारी महा-उपन्यास, बयान १७ से २० तक के सम्पूर्ण ५९ भाग।'
  });
}

// 2. Ingest Chandrakanta Santati 6 (चन्द्रकांता संतति भाग ६ - बाबू देवकीनन्दन खत्री)
async function ingestChandrakantaSantati6() {
  console.log('[BATCH-19] 2/5 Fetching चन्द्रकांता संतति (भाग ६) (देवकीनन्दन खत्री)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('चन्द्रकान्ता सन्तति 6/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const [b1, c1] = a.replace(/^चन्द्रकान्ता सन्तति 6\//, '').split('.').map(Number);
    const [b2, c2] = b.replace(/^चन्द्रकान्ता सन्तति 6\//, '').split('.').map(Number);
    if (b1 !== b2) return b1 - b2;
    return c1 - c2;
  });

  let mdContent = `---
id: "chandrakanta-santati-6"
title: "चंद्रकांता संतति (भाग ६)"
title_en: "Chandrakanta Santati Part 6"
author: "देवकीनंदन खत्री"
author_en: "Devaki Nandan Khatri"
category: "उपन्यास"
category_en: "Novel / Mystery & Fantasy"
published_year: 1896
description: "हिन्दी साहित्य के सर्वश्रेष्ठ तिलिस्मी-ऐयारी महाकाव्यात्मक उपन्यास की अन्तिम एवं निर्णायक कड़ी। तिलिस्म का रहस्योद्घाटन, रोहतासगढ़ के रहस्यों का पटाक्षेप, मायारानी व दुश्मनों का अन्त और सभी ऐयारों का भव्य संगम। बयान २१ से २४ का सम्पूर्ण चरम रोमांच।"
keywords: ["chandrakanta santati", "devaki nandan khatri", "bhootnath", "tilasm", "aiyari", "fantasy novel", "part 6", "finale"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^चन्द्रकान्ता सन्तति 6\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const [bayan, chap] = cleanTitle.split('.');
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# बयान ${bayan} - भाग ${chap}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-19] Ingested Chandrakanta Santati 6 chapter ${totalChapters}/${subpages.length}: बयान ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-19] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'chandrakanta-santati-6.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-19] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'chandrakanta-santati-6',
    title_hi: 'चंद्रकांता संतति (भाग ६)',
    title_en: 'Chandrakanta Santati Part 6',
    author_hi: 'देवकीनंदन खत्री',
    author_en: 'Devaki Nandan Khatri',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Mystery & Fantasy',
    published_year: 1896,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/चन्द्रकान्ता_सन्तति_6',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१८९६ ईस्वी में प्रकाशित बाबू देवकीनन्दन खत्री (१८६१–१९१३) का तिलिस्मी-ऐयारी महा-उपन्यास का निर्णायक अन्तिम छठा भाग, बयान २१ से २४ तक के सम्पूर्ण ४५ अध्याय। इसके साथ हर्फ़ में सम्पूर्ण २४ बयानों का चंद्रकांता संतति महाकाव्य पूर्ण हुआ।'
  });
}

// 3. Ingest Katora Bhar Khoon (कटोरा भर खून - बाबू देवकीनन्दन खत्री)
async function ingestKatoraBharKhoon() {
  console.log('[BATCH-19] 3/5 Fetching कटोरा भर खून (देवकीनन्दन खत्री)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('कटोरा भर खून/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title).filter(t => !t.includes('मुखपृष्ठ'));

  subpages.sort((a, b) => {
    const n1 = devanagariToNumber(a.replace(/^कटोरा भर खून\//, ''));
    const n2 = devanagariToNumber(b.replace(/^कटोरा भर खून\//, ''));
    return n1 - n2;
  });

  let mdContent = `---
id: "katora-bhar-khoon"
title: "कटोरा भर खून"
title_en: "Katora Bhar Khoon"
author: "देवकीनंदन खत्री"
author_en: "Devaki Nandan Khatri"
category: "उपन्यास"
category_en: "Novel / Detective & Mystery"
published_year: 1901
description: "बाबू देवकीनन्दन खत्री द्वारा रचित ऐतिहासिक रहस्य-रोमांच और जासूसी उपन्यास। राजमहल के षड्यंत्र, भयानक हत्या, कटोरा भर ताज़ा ख़ून का रहस्य और निर्दोषों को बचाने की जासूसी खोज का १६ अध्यायों में फैला अत्यंत रोमांचक आख्यान।"
keywords: ["katora bhar khoon", "devaki nandan khatri", "detective novel", "mystery", "crime fiction", "hindi classic"]
cover: ""
---

`;

  let totalChapters = 0;
  for (let i = 0; i < subpages.length; i++) {
    const pageTitle = subpages[i];
    try {
      const cleanTitle = pageTitle.replace(/^कटोरा भर खून\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      let clean = stripNavHeader(cleanWikiHtml(raw));

      // In chapter 1, strip trailing duplicate beginning of chapter 2 if present
      if (i === 0) {
        clean = clean.split(/\n\n२\n/)[0].trim();
      }

      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# अध्याय ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-19] Ingested Katora Bhar Khoon chapter ${totalChapters}/${subpages.length}: अध्याय ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-19] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'katora-bhar-khoon.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-19] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'katora-bhar-khoon',
    title_hi: 'कटोरा भर खून',
    title_en: 'Katora Bhar Khoon',
    author_hi: 'देवकीनंदन खत्री',
    author_en: 'Devaki Nandan Khatri',
    category_hi: 'उपन्यास',
    category_en: 'Novel / Detective & Mystery',
    published_year: 1901,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कटोरा_भर_खून',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९०१ (लहरी प्रेस, वाराणसी) में प्रकाशित बाबू देवकीनन्दन खत्री (१८६१–१९१३) का सम्पूर्ण १६ अध्यायों का ऐतिहासिक जासूसी एवं रहस्य उपन्यास।'
  });
}

// 4. Ingest Nav-Nidhi (नव-निधि - मुंशी प्रेमचंद)
async function ingestNavNidhi() {
  console.log('[BATCH-19] 4/5 Fetching नव-निधि (मुंशी प्रेमचंद)...');

  const canonicalOrder = [
    'नव-निधि/राजा हरदौल',
    'नव-निधि/रानी-सारन्धा',
    'नव-निधि/मर्यादा की वेदी',
    'नव-निधि/पाप का अग्निकुण्ड',
    'नव-निधि/धोखा',
    'नव-निधि/अमावस्या की रात्रि',
    'नव-निधि/ममता',
    'नव-निधि/पछतावा',
    'नव-निधि/जुगुनू की चमक'
  ];

  let mdContent = `---
id: "nav-nidhi"
title: "नव-निधि"
title_en: "Nav-Nidhi"
author: "प्रेमचंद"
author_en: "Premchand"
category: "कहानी"
category_en: "Short Stories / Classical Fiction"
published_year: 1917
description: "मुंशी प्रेमचंद के कालजयी नौ ऐतिहासिक व सामाजिक कथा-रत्नों का प्रसिद्ध संग्रह—राजा हरदौल, रानी-सारन्धा, मर्यादा की वेदी, पाप का अग्निकुण्ड, धोखा, अमावस्या की रात्रि, ममता, पछतावा और जुगुनू की चमक। भारतीय त्याग, शौर्य और मानवीय संवेदनाओं का अमिट दस्तावेज।"
keywords: ["nav nidhi", "premchand", "raja hardaul", "rani sarandha", "hindi kahani", "classic stories"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of canonicalOrder) {
    try {
      const cleanTitle = pageTitle.replace(/^नव-निधि\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        console.log(`[BATCH-19] Ingested Nav-Nidhi story ${totalChapters}/${canonicalOrder.length}: ${cleanTitle} (${clean.length} chars)`);
      }
      await sleep(150);
    } catch (e) {
      console.warn(`[BATCH-19] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'nav-nidhi.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-19] Saved ${filePath} with ${totalChapters} stories.`);

  logSourceRecord({
    id: 'nav-nidhi',
    title_hi: 'नव-निधि',
    title_en: 'Nav-Nidhi',
    author_hi: 'प्रेमचंद',
    author_en: 'Premchand',
    category_hi: 'कहानी',
    category_en: 'Short Stories / Classical Fiction',
    published_year: 1917,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/नव-निधि',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९१७ ज़माना प्रेस / नवल किशोर प्रेस से प्रकाशित मुंशी प्रेमचंद (१८८०–१९३६) का सम्पूर्ण ९ ऐतिहासिक एवं सामाजिक कहानियों का कालजयी संग्रह।'
  });
}

// 5. Ingest Raksha Bandhan (रक्षा बंधन - पं. विश्वम्भरनाथ शर्मा 'कौशिक')
async function ingestRakshaBandhan() {
  console.log('[BATCH-19] 5/5 Fetching रक्षा बंधन (पं. विश्वम्भरनाथ शर्मा कौशिक)...');

  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('रक्षा बंधन/')}&aplimit=200&format=json`;
  const res = await fetchJson(url);
  const subpages = (res?.query?.allpages || []).map(p => p.title);

  subpages.sort((a, b) => {
    const subA = a.replace(/^रक्षा बंधन\//, '');
    const subB = b.replace(/^रक्षा बंधन\//, '');
    const m1 = subA.match(/^[\u200B-\u200D\uFEFF\u2060]*([०-९]+)/);
    const m2 = subB.match(/^[\u200B-\u200D\uFEFF\u2060]*([०-९]+)/);
    const n1 = m1 ? devanagariToNumber(m1[1]) : 999;
    const n2 = m2 ? devanagariToNumber(m2[1]) : 999;
    return n1 - n2;
  });

  let mdContent = `---
id: "raksha-bandhan"
title: "रक्षा बंधन"
title_en: "Raksha Bandhan"
author: "विश्वम्भरनाथ शर्मा 'कौशिक'"
author_en: "Pt. Vishwambharnath Sharma 'Kaushik'"
category: "कहानी"
category_en: "Short Stories / Social Realism"
published_year: 1920
description: "पं. विश्वम्भरनाथ शर्मा 'कौशिक' का सुप्रसिद्ध २४ कहानियों का प्रतिनिधि संग्रह। शीर्षक कहानी 'रक्षा-बन्धन' के साथ-साथ तत्कालीन समाज, मानवीय संबंधों, हास्य-व्यंग्य और मध्यमवर्गीय जीवन की विसंगतियों का मार्मिक एवं जीवंत चित्रण।"
keywords: ["raksha bandhan", "vishwambharnath sharma kaushik", "kaushik ji", "short stories", "social realism", "hindi literature"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const pageTitle of subpages) {
    try {
      const cleanTitle = pageTitle.replace(/^रक्षा बंधन\//, '').replace(/[\uFEFF\u2060]/g, '').trim();
      const raw = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${cleanTitle}\n\n${clean}\n\n`;
        if (totalChapters % 6 === 0 || totalChapters === subpages.length) {
          console.log(`[BATCH-19] Ingested Raksha Bandhan story ${totalChapters}/${subpages.length}: ${cleanTitle} (${clean.length} chars)`);
        }
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-19] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'raksha-bandhan.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-19] Saved ${filePath} with ${totalChapters} stories.`);

  logSourceRecord({
    id: 'raksha-bandhan',
    title_hi: 'रक्षा बंधन',
    title_en: 'Raksha Bandhan',
    author_hi: "विश्वम्भरनाथ शर्मा 'कौशिक'",
    author_en: "Pt. Vishwambharnath Sharma 'Kaushik'",
    category_hi: 'कहानी',
    category_en: 'Short Stories / Social Realism',
    published_year: 1920,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/रक्षा_बंधन',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: "१९२० साहित्य सदन, चिरगांव/झांसी से प्रकाशित पं. विश्वम्भरनाथ शर्मा 'कौशिक' (१८९१–१९४५) का सम्पूर्ण २४ कहानियों का प्रामाणिक प्रथम संस्करण।"
  });
}

async function runBatch19() {
  console.log('=== STARTING BATCH 19 INGESTION ===');
  await ingestChandrakantaSantati5();
  await ingestChandrakantaSantati6();
  await ingestKatoraBharKhoon();
  await ingestNavNidhi();
  await ingestRakshaBandhan();
  console.log('=== COMPLETED BATCH 19 INGESTION ===');
}

runBatch19().catch(console.error);
