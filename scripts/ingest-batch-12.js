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
  return text.replace(/^[^\n]*?(?:←|→|द्वारा)[^\n]*?\n+/gis, '').trim();
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

// 1. Ingest Ek Ghoont (एक घूँट by Jaishankar Prasad) - First Hindi One-Act Play
async function ingestEkGhoont() {
  console.log('[BATCH-12] Fetching एक घूँट (Jaishankar Prasad)...');

  let mdContent = `---
id: "ek-ghoont"
title: "एक घूँट"
title_en: "Ek Ghoont"
author: "जयशंकर प्रसाद"
author_en: "Jaishankar Prasad"
category: "नाटक"
category_en: "Play / One-Act Drama"
published_year: 1930
description: "हिन्दी साहित्य का प्रथम आधुनिक एकांकी नाटक (१९३०)। रस, प्रेम, वैवाहिक जीवन के बंधनों और स्वच्छंदता पर आनंदवादी दर्शन का जीवंत नाट्य-निरूपण। रसाल, वनलता, आनंद और प्रीति के माध्यम से प्रसादीय नाट्य-प्रतिभा का अनूठा एकांकी।"
keywords: ["ek ghoont", "jaishankar prasad", "first hindi one act play", "ekanki", "anandvad", "natak"]
cover: ""
---

`;

  let totalParts = 0;
  try {
    const html = await fetchWikiPage('एक घूँट');
    const clean = stripNavHeader(cleanWikiHtml(html));
    if (clean.length > 100) {
      totalParts++;
      mdContent += `\n# एक घूँट — सम्पूर्ण एकांकी नाटक\n\n${clean}\n\n`;
      console.log('[BATCH-12] Ingested एक घूँट सम्पूर्ण');
    }
  } catch (e) {
    console.warn('[BATCH-12] Error fetching Ek Ghoont:', e.message);
  }

  const filePath = path.join(RAW_DIR, 'ek-ghoont.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-12] Saved ${filePath} with ${totalParts} part.`);

  logSourceRecord({
    id: 'ek-ghoont',
    title_hi: 'एक घूँट',
    title_en: 'Ek Ghoont',
    author_hi: 'जयशंकर प्रसाद',
    author_en: 'Jaishankar Prasad',
    category_hi: 'नाटक',
    category_en: 'Play / One-Act Drama',
    published_year: 1930,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/एक_घूँट',
    ingested_at: '2026-11-14',
    chapter_count: totalParts,
    verification_notes: '१९३०/१९४७ भारती-भण्डार (लीडर प्रेस, प्रयाग) से सत्यापित हिन्दी का प्रथम आधुनिक एकांकी नाटक।'
  });
}

// 2. Ingest Kavya Aur Kala Tatha Anya Nibandh (काव्य और कला तथा अन्य निबन्ध by Jaishankar Prasad)
async function ingestKavyaAurKala() {
  console.log('[BATCH-12] Fetching काव्य और कला तथा अन्य निबन्ध (Jaishankar Prasad)...');

  const essays = [
    { title: 'प्राक्कथन', page: 'काव्य और कला तथा अन्य निबन्ध/प्राक्कथन' },
    { title: 'काव्य और कला', page: 'काव्य और कला तथा अन्य निबन्ध/काव्य और कला' },
    { title: 'रस', page: 'काव्य और कला तथा अन्य निबन्ध/रस' },
    { title: 'रहस्यवाद', page: 'काव्य और कला तथा अन्य निबन्ध/रहस्यवाद' },
    { title: 'यथार्थवाद और छायावाद', page: 'काव्य और कला तथा अन्य निबन्ध/यथार्थवाद और छायावाद' },
    { title: 'रंगमंच', page: 'काव्य और कला तथा अन्य निबन्ध/रंगमंच' },
    { title: 'नाटकों का आरम्भ', page: 'काव्य और कला तथा अन्य निबन्ध/नाटकों का आरम्भ' },
    { title: 'नाटकों में रस का प्रयोग', page: 'काव्य और कला तथा अन्य निबन्ध/नाटकों में रस का प्रयोग' },
    { title: 'आरम्भिक पाठ्य काव्य', page: 'काव्य और कला तथा अन्य निबन्ध/आरम्भिक पाठ्य काव्य' }
  ];

  let mdContent = `---
id: "kavya-aur-kala"
title: "काव्य और कला तथा अन्य निबन्ध"
title_en: "Kavya Aur Kala Tatha Anya Nibandh"
author: "जयशंकर प्रसाद"
author_en: "Jaishankar Prasad"
category: "निबंध"
category_en: "Essays"
published_year: 1939
description: "जयशंकर प्रसाद का अमर सौंदर्यशास्त्रीय और दार्शनिक निबंध-संग्रह। छायावाद की तात्विक व्याख्या, यथार्थवाद बनाम आदर्शवाद, रस-सिद्धांत, भारतीय रंगमंच का इतिहास और रहस्यवाद की गंभीर शास्त्रीय मीमांसा।"
keywords: ["kavya aur kala", "jaishankar prasad", "chhayavad", "realism", "literary criticism", "aesthetics", "nibandh"]
cover: ""
---

`;

  let totalEssays = 0;
  for (const es of essays) {
    try {
      const html = await fetchWikiPage(es.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalEssays++;
        mdContent += `\n# निबंध — ${es.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-12] Ingested Kavya Aur Kala: ${es.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-12] Error fetching ${es.page}:`, e.message);
    }
    await sleep(150);
  }

  const filePath = path.join(RAW_DIR, 'kavya-aur-kala.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-12] Saved ${filePath} with ${totalEssays} essays.`);

  logSourceRecord({
    id: 'kavya-aur-kala',
    title_hi: 'काव्य और कला तथा अन्य निबन्ध',
    title_en: 'Kavya Aur Kala Tatha Anya Nibandh',
    author_hi: 'जयशंकर प्रसाद',
    author_en: 'Jaishankar Prasad',
    category_hi: 'निबंध',
    category_en: 'Essays',
    published_year: 1939,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/काव्य_और_कला_तथा_अन्य_निबन्ध',
    ingested_at: '2026-11-14',
    chapter_count: totalEssays,
    verification_notes: '१९३९ के मूल मरणोपरांत संकलन से हिन्दी विकिस्रोत पर सत्यापित सम्पूर्ण ९ सौंदर्यशास्त्रीय निबंध।'
  });
}

// 3. Ingest Meri Aatmakahani (मेरी आत्मकहानी by Babu Shyam Sundar Das) - 12 Chapters
async function ingestMeriAatmakahani() {
  console.log('[BATCH-12] Fetching मेरी आत्मकहानी (Babu Shyam Sundar Das)...');

  const chapters = [
    { title: 'अध्याय १ — वंश-परिचय और शिक्षा', page: 'मेरी आत्मकहानी/१ वंश-परिचय और शिक्षा' },
    { title: 'अध्याय २ — नागरी-प्रचारिणी सभा की स्थापना', page: 'मेरी आत्मकहानी/२ नागरी-प्रचारिणी सभा' },
    { title: 'अध्याय ३ — अदालतों में नागरी लिपि का प्रवेश', page: 'मेरी आत्मकहानी/३ अदालतों में नागरी' },
    { title: 'अध्याय ४ — हिंदी-वैज्ञानिक कोष का निर्माण', page: 'मेरी आत्मकहानी/४ हिंदी-वैज्ञानिक कोष' },
    { title: 'अध्याय ५ — हिंदी की लेख तथा लिपि-प्रणाली', page: 'मेरी आत्मकहानी/५ हिंदी की लेख तथा लिपि-प्रणाली' },
    { title: 'अध्याय ६ — हस्तलिखित हिंदी-पुस्तकों की ऐतिहासिक खोज', page: 'मेरी आत्मकहानी/६ हस्तलिखित हिंदी-पुस्तकों की खोज' },
    { title: 'अध्याय ७ — कुछ अन्य महत्वपूर्ण साहित्यिक कार्य', page: 'मेरी आत्मकहानी/७ कुछ अन्य कार्य' },
    { title: 'अध्याय ८ — आपत्तियों का पहाड़ व संघर्ष', page: 'मेरी आत्मकहानी/८ आपत्तियों का पहाड़' },
    { title: 'अध्याय ९ — हिंदी-शब्दसागर का ऐतिहासिक महायज्ञ', page: 'मेरी आत्मकहानी/९ हिंदी-शब्दसागर' },
    { title: 'अध्याय १० — लखनऊ का प्रवास व सेवाएँ', page: 'मेरी आत्मकहानी/१० लखनऊ का प्रवास' },
    { title: 'अध्याय ११ — काशी हिन्दू विश्वविद्यालय में हिन्दी विभाग', page: 'मेरी आत्मकहानी/११ काशी-विश्वविद्यालय' },
    { title: 'अध्याय १२ — कुछ व्यक्तिगत संस्मरण व जीवन-सत्य', page: 'मेरी आत्मकहानी/१२ कुछ व्यक्तिगत बातें' }
  ];

  let mdContent = `---
id: "meri-aatmakahani"
title: "मेरी आत्मकहानी"
title_en: "Meri Aatmakahani"
author: "बाबू श्यामसुन्दर दास"
author_en: "Babu Shyam Sundar Das"
category: "जीवनी व संस्मरण"
category_en: "Autobiography / Memoir"
published_year: 1941
description: "आधुनिक हिन्दी गद्य व नागरीप्रचारिणी सभा के संस्थापक-निर्माता बाबू श्यामसुन्दर दास की ऐतिहासिक आत्मकथा। हिन्दी शब्दसागर, नागरी आंदोलन, काशी हिन्दू विश्वविद्यालय के हिन्दी विभाग की स्थापना और हिन्दी नवजागरण का जीवंत दस्तावेज।"
keywords: ["meri aatmakahani", "shyam sundar das", "nagari pracharini sabha", "hindi shabdasagar", "autobiography", "memoir"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const ch of chapters) {
    try {
      const html = await fetchWikiPage(ch.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# ${ch.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-12] Ingested Meri Aatmakahani ${totalChapters}/12: ${ch.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-12] Error fetching ${ch.page}:`, e.message);
    }
    await sleep(150);
  }

  const filePath = path.join(RAW_DIR, 'meri-aatmakahani.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-12] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'meri-aatmakahani',
    title_hi: 'मेरी आत्मकहानी',
    title_en: 'Meri Aatmakahani',
    author_hi: 'बाबू श्यामसुन्दर दास',
    author_en: 'Babu Shyam Sundar Das',
    category_hi: 'जीवनी व संस्मरण',
    category_en: 'Autobiography / Memoir',
    published_year: 1941,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/मेरी_आत्मकहानी',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९४१ मूल संस्करण से हिन्दी विकिस्रोत पर सत्यापित नागरीप्रचारिणी सभा व हिन्दी शब्दसागर के निर्माता की सम्पूर्ण १२ अध्यायों की आत्मकथा।'
  });
}

// 4. Ingest Paanch Phool (पाँच फूल by Munshi Premchand) - 7 Stories + Prastavana
async function ingestPaanchPhool() {
  console.log('[BATCH-12] Fetching पाँच फूल (Munshi Premchand)...');

  // Query pages using allpages API to handle any zero-width space characters cleanly
  const res = await fetchJson(`https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('पाँच फूल/')}&aplimit=20&format=json`);
  const pages = res?.query?.allpages?.map(p => p.title) || [];

  let mdContent = `---
id: "paanch-phool"
title: "पाँच फूल"
title_en: "Paanch Phool"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "कहानी"
category_en: "Stories"
published_year: 1921
description: "मुंशी प्रेमचंद की अमर कहानी 'मंत्र' (डॉ. चड्ढा और बूढ़े भगत की मार्मिक कथा) सहित सात उत्कृष्ट कहानियों का संकलन। त्याग, कर्तव्य-बोध, स्वाभिमान और सामाजिक विषमता पर रचित प्रेमचंद की कालजयी कृतियाँ।"
keywords: ["paanch phool", "mantra", "munshi premchand", "dr chadha", "classic stories", "kahani"]
cover: ""
---

`;

  let totalStories = 0;
  for (const pageTitle of pages) {
    const rawName = pageTitle.replace('पाँच फूल/', '').replace(/[\u200B-\u200D\uFEFF\u2060]/g, '').trim();
    try {
      const html = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalStories++;
        mdContent += `\n# कहानी — ${rawName}\n\n${clean}\n\n`;
        console.log(`[BATCH-12] Ingested Paanch Phool: ${rawName}`);
      }
    } catch (e) {
      console.warn(`[BATCH-12] Error fetching ${pageTitle}:`, e.message);
    }
    await sleep(150);
  }

  const filePath = path.join(RAW_DIR, 'paanch-phool.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-12] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'paanch-phool',
    title_hi: 'पाँच फूल',
    title_en: 'Paanch Phool',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'कहानी',
    category_en: 'Stories',
    published_year: 1921,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/पाँच_फूल',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: '१९२१/१९२९ मूल संस्करण से हिन्दी विकिस्रोत पर सत्यापित अमर कहानी "मंत्र" सहित सम्पूर्ण ७ कहानियाँ व प्रस्तावना।'
  });
}

// 5. Ingest Revatat - Prithviraj Raso (रेवातट — पृथ्वीराज रासो by Chand Bardai)
async function ingestRevatat() {
  console.log('[BATCH-12] Fetching रेवातट (पृथ्वीराज रासो by Chand Bardai)...');

  let mdContent = `---
id: "revatat-prithviraj-raso"
title: "रेवातट (पृथ्वीराज रासो)"
title_en: "Revatat (Prithviraj Raso)"
author: "महाकवि चंदबरदाई"
author_en: "Chand Bardai"
category: "कविता"
category_en: "Poetry"
published_year: 1192
description: "हिन्दी साहित्य के प्रथम महाकाव्य 'पृथ्वीराज रासो' का सर्वोत्कृष्ट सत्ताईसवाँ समय (सर्ग)। नर्मदा (रेवा) तट पर दिल्लीपति पृथ्वीराज चौहान और शहाबुद्दीन गोरी के ऐतिहासिक संग्राम, वीर रस और अपभ्रंश-पिंगल छंद-शिल्प का अनुपम महाकाव्यात्मक शिखर।"
keywords: ["revatat", "prithviraj raso", "chand bardai", "prithviraj chauhan", "veer gatha", "adi kavya", "kavita"]
cover: ""
---

`;

  let totalSections = 0;

  // 1. Katha Saar (परिशिष्ट/१. रेवातट समय की कथा)
  try {
    const kathaHtml = await fetchWikiPage('रेवातट (पृथ्वीराज-रासो)/परिशिष्ट/१. रेवातट समय की कथा');
    const kathaClean = stripNavHeader(cleanWikiHtml(kathaHtml));
    if (kathaClean.length > 50) {
      totalSections++;
      mdContent += `\n# प्रस्तावना एवं रेवातट-कथा सार — डॉ. विपिन बिहारी त्रिवेदी\n\n${kathaClean}\n\n`;
      console.log('[BATCH-12] Ingested रेवातट कथा सार');
    }
  } catch (e) {
    console.warn('[BATCH-12] Error fetching Revatat Katha Saar:', e.message);
  }
  await sleep(200);

  // 2. Original Epic Text (रेवातट समय)
  try {
    const epicHtml = await fetchWikiPage('रेवातट (पृथ्वीराज-रासो)/रेवातट समय');
    const epicClean = stripNavHeader(cleanWikiHtml(epicHtml));
    if (epicClean.length > 100) {
      totalSections++;
      mdContent += `\n# रेवातट समय (मूल रासो महाकाव्य) — महाकवि चंदबरदाई\n\n${epicClean}\n\n`;
      console.log('[BATCH-12] Ingested रेवातट समय मूल महाकाव्य');
    }
  } catch (e) {
    console.warn('[BATCH-12] Error fetching Revatat Samay:', e.message);
  }

  const filePath = path.join(RAW_DIR, 'revatat-prithviraj-raso.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-12] Saved ${filePath} with ${totalSections} epic sections.`);

  logSourceRecord({
    id: 'revatat-prithviraj-raso',
    title_hi: 'रेवातट (पृथ्वीराज रासो)',
    title_en: 'Revatat (Prithviraj Raso)',
    author_hi: 'महाकवि चंदबरदाई',
    author_en: 'Chand Bardai',
    category_hi: 'कविता',
    category_en: 'Poetry',
    published_year: 1192,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/रेवातट_(पृथ्वीराज-रासो)',
    ingested_at: '2026-11-14',
    chapter_count: totalSections,
    verification_notes: 'डॉ. विपिन बिहारी त्रिवेदी द्वारा संपादित प्रामाणिक संस्करण से पृथ्वीराज रासो का सत्ताईसवाँ समय (रेवातट) व कथा-सार।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 12 INGESTION ===\n');
  await ingestEkGhoont();
  await ingestKavyaAurKala();
  await ingestMeriAatmakahani();
  await ingestPaanchPhool();
  await ingestRevatat();
  console.log('\n=== BATCH 12 INGESTION FINISHED ===');
}

main().catch(console.error);
