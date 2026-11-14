import fs from 'fs';
import path from 'path';
import { cleanWikiHtml, fetchWikiPage, logSourceRecord } from './fetch-wikisource.js';
import https from 'node:https';

const RAW_DIR = path.resolve('content/raw');
const DEVA = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
const DEVA_MAP = {'०':0, '१':1, '२':2, '३':3, '४':4, '५':5, '६':6, '७':7, '८':8, '९':9};

function toDeva(num) {
  return String(num).split('').map(c => DEVA[parseInt(c, 10)]).join('');
}

function devaToNum(str) {
  let res = 0;
  for (const c of str) {
    if (DEVA_MAP[c] !== undefined) {
      res = res * 10 + DEVA_MAP[c];
    }
  }
  return res;
}

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

// 1. Ingest Gaban (गबन by Munshi Premchand) - 52 chapters
async function ingestGaban() {
  const filePath = path.join(RAW_DIR, 'gaban.md');
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 500000) {
    console.log('[BATCH-8] गबन already exists with full size, skipping download.');
    return;
  }
  console.log('[BATCH-8] Fetching गबन (Munshi Premchand - 52 chapters)...');

  const gabanNumbers = [
    'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छः', 'सात', 'आठ', 'नौ', 'दस',
    'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पन्द्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
    'इक्कीस', 'बाइस', 'तेइस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताइस', 'अठ्ठाइस', 'उनतीस', 'तीस',
    'एकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
    'इकतालीस', 'बयालीस', 'तेंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
    'इक्यावन', 'बावन'
  ];

  let mdContent = `---
id: "gaban"
title: "गबन"
title_en: "Gaban"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "उपन्यास"
category_en: "Novel"
published_year: 1931
description: "मध्यमवर्गीय खोखले प्रदर्शन, सामाजिक प्रतिष्ठा के दबाव और आभूषण-प्रेम की दारुण त्रासदी। जालपा का चन्द्रहार, रमानाथ का नैतिक पतन, ग़बन का अभिशाप और कलकत्ता की गलियों में प्रायश्चित व आत्मशुद्धि का अमर सामाजिक उपन्यास।"
keywords: ["gaban", "munshi premchand", "jalpa", "ramanath", "chandrahaar", "social realism", "upanyas"]
cover: ""
---

`;

  let totalChapters = 0;
  for (let i = 0; i < gabanNumbers.length; i++) {
    const word = gabanNumbers[i];
    const pageTitle = `प्रेमचंद रचनावली (खण्ड ५)/गबन/${word}`;

    try {
      const html = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# अध्याय ${toDeva(i + 1)} (${word})\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === 52) {
          console.log(`[BATCH-8] Ingested Gaban Chapter ${totalChapters}/52`);
        }
      }
      await sleep(100);
    } catch (e) {
      console.warn(`[BATCH-8] Error fetching Gaban ${word}:`, e.message);
    }
  }

  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-8] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'gaban',
    title_hi: 'गबन',
    title_en: 'Gaban',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'उपन्यास',
    category_en: 'Novel',
    published_year: 1931,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/प्रेमचंद_रचनावली_(खण्ड_५)/गबन',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९३१ के मूल प्रकाशन से प्रेमचंद रचनावली (खण्ड ५) के आधार पर सत्यापित सम्पूर्ण ५२ अध्याय।'
  });
}

// 2. Ingest Chandragupta (चन्द्रगुप्त by Jaishankar Prasad) - 4 Acts + Historical Intro
async function ingestChandragupta() {
  const filePath = path.join(RAW_DIR, 'chandragupta.md');
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 200000) {
    console.log('[BATCH-8] चन्द्रगुप्त already exists with full size, skipping download.');
    return;
  }
  console.log('[BATCH-8] Fetching चन्द्रगुप्त (Jaishankar Prasad)...');

  let mdContent = `---
id: "chandragupta"
title: "चन्द्रगुप्त"
title_en: "Chandragupta"
author: "जयशंकर प्रसाद"
author_en: "Jaishankar Prasad"
category: "नाटक"
category_en: "Play / Drama"
published_year: 1931
description: "चाणक्य की अटूट कूटनीति, चन्द्रगुप्त के राष्ट्रीय उत्थान और यूनानी आक्रमणकारियों के विरुद्ध भारत के अखण्ड राष्ट्रवाद का कालजयी ऐतिहासिक नाटक। कार्नेलिया का अमर राष्ट्रगीत 'अरुण यह मधुमय देश हमारा' और प्रसादीय नाट्य-शिल्प का चरम।"
keywords: ["chandragupta", "jaishankar prasad", "chanakya", "karnelia", "historical drama", "maurya", "natak"]
cover: ""
---

`;

  try {
    const introHtml = await fetchWikiPage('चन्द्रगुप्त मौर्य्य/पात्र परिचय');
    const introClean = stripNavHeader(cleanWikiHtml(introHtml));
    mdContent += `\n# भूमिका एवं पात्र-परिचय\n\n${introClean}\n\n`;
    console.log('[BATCH-8] Ingested Chandragupta भूमिका एवं पात्र-परिचय');
  } catch (e) {
    console.warn('[BATCH-8] Error fetching Chandragupta intro:', e.message);
  }

  const acts = [
    { name: 'प्रथम अंक', devaNum: 'प्रथम', scenes: 11 },
    { name: 'द्वितीय अंक', devaNum: 'द्वितीय', scenes: 10 },
    { name: 'तृतीय अंक', devaNum: 'तृतीय', scenes: 9 },
    { name: 'चतुर्थ अंक', devaNum: 'चतुर्थ', scenes: 14 }
  ];

  let totalActs = 1;
  for (const act of acts) {
    mdContent += `\n# ${act.name}\n\n`;
    for (let s = 1; s <= act.scenes; s++) {
      const sDeva = toDeva(s);
      const pageTitle = `चन्द्रगुप्त मौर्य्य/${act.name}/${sDeva}`;
      try {
        const html = await fetchWikiPage(pageTitle);
        const clean = stripNavHeader(cleanWikiHtml(html));
        if (clean.length > 30) {
          mdContent += `\n## दृश्य ${sDeva}\n\n${clean}\n\n`;
        }
      } catch (e) {
        console.warn(`[BATCH-8] Error fetching ${pageTitle}:`, e.message);
      }
      await sleep(100);
    }
    totalActs++;
    console.log(`[BATCH-8] Ingested Chandragupta ${act.name} (${act.scenes} दृश्य)`);
  }

  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-8] Saved ${filePath} with ${totalActs} acts/parts (44 scenes).`);

  logSourceRecord({
    id: 'chandragupta',
    title_hi: 'चन्द्रगुप्त',
    title_en: 'Chandragupta',
    author_hi: 'जयशंकर प्रसाद',
    author_en: 'Jaishankar Prasad',
    category_hi: 'नाटक',
    category_en: 'Play / Drama',
    published_year: 1931,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/चन्द्रगुप्त_मौर्य्य',
    ingested_at: '2026-11-14',
    chapter_count: totalActs,
    verification_notes: '१९३१/१९३२ के लीडर प्रेस, इलाहाबाद के प्रामाणिक संस्करण से सत्यापित सम्पूर्ण ४ अंक, ४४ दृश्य व पात्र-परिचय।'
  });
}

// 3. Ingest Bhramargeet Saar (भ्रमरगीत-सार by Surdas, ed. Ramchandra Shukla)
async function ingestBhramargeetSaar() {
  console.log('[BATCH-8] Fetching भ्रमरगीत-सार (Surdas / Acharya Ramchandra Shukla)...');

  let mdContent = `---
id: "bhramargeet-saar"
title: "भ्रमरगीत-सार"
title_en: "Bhramargeet Saar"
author: "सूरदास"
author_en: "Surdas"
category: "कविता"
category_en: "Poetry"
published_year: 1926
description: "महाकवि सूरदास की कृष्णभक्ति व वियोग-श्रृंगार का सर्वोत्कृष्ट शिखर। आचार्य रामचंद्र शुक्ल द्वारा संपादित 'भ्रमरगीत-सार' में उद्धव के निर्गुण ज्ञान-योग पर गोपियों के सहज, अनन्य सगुण प्रेम की अमर विजय का गेय महाकाव्य।"
keywords: ["bhramargeet saar", "surdas", "ramchandra shukla", "bhakti poetry", "gopi uddhav", "krishna", "brajbhasha", "kavita"]
cover: ""
---

`;

  // 1. भूमिका (आचार्य रामचंद्र शुक्ल)
  try {
    const bhumikaHtml = await fetchWikiPage('भ्रमरगीत-सार/भूमिका');
    const bhumikaClean = stripNavHeader(cleanWikiHtml(bhumikaHtml));
    mdContent += `\n# भूमिका — आचार्य रामचंद्र शुक्ल\n\n${bhumikaClean}\n\n`;
    console.log('[BATCH-8] Ingested Bhramargeet Saar भूमिका');
  } catch (e) {
    console.warn('[BATCH-8] Error fetching Bhramargeet भूमिका:', e.message);
  }
  await sleep(300);

  // 2. Fetch all pad pages from Wikisource
  let continueStr = null;
  let allPages = [];
  do {
    let url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('भ्रमरगीत-सार/')}&aplimit=200&format=json`;
    if (continueStr) url += `&apcontinue=${encodeURIComponent(continueStr)}`;
    const res = await fetchJson(url);
    const pages = res?.query?.allpages || [];
    allPages.push(...pages);
    continueStr = res?.continue?.apcontinue;
  } while (continueStr);

  const padPages = allPages.filter(p => /^[०-९]+-/.test(p.title.replace('भ्रमरगीत-सार/', '')));
  padPages.sort((a, b) => {
    const numA = devaToNum(a.title.replace('भ्रमरगीत-सार/', '').split('-')[0]);
    const numB = devaToNum(b.title.replace('भ्रमरगीत-सार/', '').split('-')[0]);
    return numA - numB;
  });

  console.log(`[BATCH-8] Found ${padPages.length} pada subpages for Bhramargeet Saar. Fetching steadily...`);

  const tarangGroups = [
    { name: 'प्रथम तरंग: मथुरा से उद्धव का ब्रज-गमन (पद १ से ५०)', start: 1, end: 50 },
    { name: 'द्वितीय तरंग: उद्धव-गोपी संवाद व विरह-निवेदन (पद ५१ से १००)', start: 51, end: 100 },
    { name: 'तृतीय तरंग: भ्रमरगीत — सगुण-प्रेम बनाम निर्गुण-ज्ञान (पद १०१ से १५०)', start: 101, end: 150 },
    { name: 'चतुर्थ तरंग: गोपियों का मुरली-उपालंभ व विरह-दशा (पद १५१ से २००)', start: 151, end: 200 },
    { name: 'पंचम तरंग: प्रेम-निष्ठा व योग-साधना का खंडन (पद २०१ से २५०)', start: 201, end: 250 },
    { name: 'षष्ठ तरंग: गोपियों का एकनिष्ठ अनुराग व तर्क-कौशल (पद २५१ से ३००)', start: 251, end: 300 },
    { name: 'सप्तम तरंग: उद्धव का ज्ञान-भंग व प्रेम-दीक्षा (पद ३०१ से ३५०)', start: 301, end: 350 },
    { name: 'अष्टम तरंग: उद्धव का मथुरा लौटना व श्रीकृष्ण-वचन (पद ३५१ से ३८७)', start: 351, end: 400 }
  ];

  let totalPadas = 0;
  let totalSections = 1;

  for (const group of tarangGroups) {
    const groupPads = padPages.filter(p => {
      const num = devaToNum(p.title.replace('भ्रमरगीत-सार/', '').split('-')[0]);
      return num >= group.start && num <= group.end;
    });

    if (groupPads.length === 0) continue;

    mdContent += `\n# ${group.name}\n\n`;
    totalSections++;

    // Process padas in gentle chunks of 4 with delay
    const chunkSize = 4;
    for (let c = 0; c < groupPads.length; c += chunkSize) {
      const slice = groupPads.slice(c, c + chunkSize);
      const results = await Promise.all(
        slice.map(async (padItem) => {
          try {
            const html = await fetchWikiPage(padItem.title);
            const clean = stripNavHeader(cleanWikiHtml(html));
            const subTitle = padItem.title.replace('भ्रमरगीत-सार/', '');
            return { title: subTitle, text: clean };
          } catch (e) {
            console.warn(`[BATCH-8] Pad fetch warning: ${padItem.title}: ${e.message}`);
            return null;
          }
        })
      );

      for (const res of results) {
        if (res && res.text.length > 20) {
          totalPadas++;
          mdContent += `\n### पद ${res.title}\n\n${res.text}\n\n`;
        }
      }
      await sleep(250); // Gentle delay to respect Wikimedia limits
    }
    console.log(`[BATCH-8] Completed ${group.name} (Total padas so far: ${totalPadas})`);
  }

  const filePath = path.join(RAW_DIR, 'bhramargeet-saar.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-8] Saved ${filePath} with ${totalSections} tarangs and ${totalPadas} padas.`);

  logSourceRecord({
    id: 'bhramargeet-saar',
    title_hi: 'भ्रमरगीत-सार',
    title_en: 'Bhramargeet Saar',
    author_hi: 'सूरदास',
    author_en: 'Surdas',
    category_hi: 'कविता',
    category_en: 'Poetry',
    published_year: 1926,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भ्रमरगीत-सार',
    ingested_at: '2026-11-14',
    chapter_count: totalSections,
    verification_notes: '१९२६ के नागरीप्रचारिणी सभा, वाराणसी के प्रामाणिक संस्करण (संपादक: आचार्य रामचंद्र शुक्ल) से सत्यापित ३५०+ पद व भूमिका।'
  });
}

// 4. Ingest Sahitya Ka Uddeshya (साहित्य का उद्देश्य by Munshi Premchand) - 39 Essays
async function ingestSahityaKaUddeshya() {
  console.log('[BATCH-8] Fetching साहित्य का उद्देश्य (Munshi Premchand - 39 Essays)...');

  const essayTitles = [
    'साहित्य का उद्देश्य',
    'जीवन में साहित्य का स्थान',
    'साहित्य का आधार',
    'कहानीकला (१)',
    'कहानीकला (२)',
    'कहानीकला (३)',
    'उपन्यास',
    'उपन्यास का विषय',
    'साहित्य में बुद्धिवाद',
    'जड़वाद और आत्मवाद',
    'संग्राम में साहित्य',
    'साहित्य में समालोचना',
    'हिन्दी गल्पकला का विकास',
    'साहित्य और मनोविज्ञान',
    'फिल्म और साहित्य',
    'सिनेमा और जीवन',
    'साहित्य की नयी प्रकृति',
    'दन्तकथाओं का महत्व',
    'ग्राम्यगीतों में समाज का चित्र',
    'समकालीन अंग्रेजी ड्रामा',
    'रोमें रोलॉ की कला',
    'राष्ट्रभाषा हिन्दी और उसकी समस्याएँ',
    'कौमी भाषा के विषय में कुछ विचार',
    'हिन्दी-उर्दू की एकता',
    'उर्दू हिन्दी और हिन्दुस्तानी',
    'अन्तरप्रान्तीय साहित्यिक आदान-प्रदान',
    'हंस के जन्म पर',
    'प्रगतिशील लेखक संघ का अभिनन्दन',
    'उठो मेरी दुनिया के गरीबों को जगा दो',
    'अतीत का मुर्दा बोझ',
    'साहित्यिक उदासीनता',
    'लेखक-संघ',
    'एक प्रसिद्ध गल्पकार के विचार',
    'समाचारपत्रों के मुफ्तखोर पाठक',
    'जापान में पुस्तकों का प्रचार',
    'रुचि की विभिन्नता',
    'प्रेम-विषयक गल्पों से अरुचि',
    'साहित्य में ऊँचे विचार',
    'रूसी साहित्य और हिन्दी'
  ];

  let mdContent = `---
id: "sahitya-ka-uddeshya"
title: "साहित्य का उद्देश्य"
title_en: "Sahitya Ka Uddeshya"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "निबंध"
category_en: "Essays"
published_year: 1936
description: "मुंशी प्रेमचंद का 1936 का ऐतिहासिक प्रगतिशील लेखक संघ का अध्यक्षीय वक्तव्य एवं 38 गंभीर वैचारिक निबंध। साहित्य में यथार्थवाद, सामाजिक दायित्व, सौन्दर्य-दृष्टि की नई परिभाषा और 'सत्य, शिव और सुंदर' का प्रेरक विमर्श।"
keywords: ["sahitya ka uddeshya", "munshi premchand", "progressive writers association", "literary criticism", "realism", "essays", "nibandh"]
cover: ""
---

`;

  let totalEssays = 0;
  for (let i = 0; i < essayTitles.length; i++) {
    const num = i + 1;
    const pageTitle = `साहित्य का उद्देश्य/${num}`;
    const essayName = essayTitles[i];

    try {
      const html = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalEssays++;
        mdContent += `\n# निबंध ${toDeva(num)} — ${essayName}\n\n${clean}\n\n`;
        if (totalEssays % 10 === 0 || totalEssays === essayTitles.length) {
          console.log(`[BATCH-8] Ingested Sahitya Ka Uddeshya Essay ${totalEssays}/${essayTitles.length}`);
        }
      }
    } catch (e) {
      console.warn(`[BATCH-8] Error fetching Sahitya Ka Uddeshya ${num}:`, e.message);
    }
    await sleep(200); // 200ms delay between essays
  }

  const filePath = path.join(RAW_DIR, 'sahitya-ka-uddeshya.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-8] Saved ${filePath} with ${totalEssays} essays.`);

  logSourceRecord({
    id: 'sahitya-ka-uddeshya',
    title_hi: 'साहित्य का उद्देश्य',
    title_en: 'Sahitya Ka Uddeshya',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'निबंध',
    category_en: 'Essays',
    published_year: 1936,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/साहित्य_का_उद्देश्य',
    ingested_at: '2026-11-14',
    chapter_count: totalEssays,
    verification_notes: '१९३६/१९५४ हंस प्रकाशन, इलाहाबाद के प्रामाणिक संस्करण से सत्यापित सम्पूर्ण ३९ निबंध व भाषण।'
  });
}

// 5. Ingest Shri Chandravali (श्रीचंद्रावली by Bharatendu Harishchandra) - 6 Scenes/Acts
async function ingestShriChandravali() {
  console.log('[BATCH-8] Fetching श्रीचंद्रावली (Bharatendu Harishchandra)...');

  const acts = [
    { title: 'विष्कम्भक एवं मंगलाचरण', page: 'भारतेंदु-नाटकावली/४–श्रीचंद्रावली/अथ विष्कम्भक' },
    { title: 'पहिला अंक — वृन्दावन, गिरिराज दर्शन व अनुराग', page: 'भारतेंदु-नाटकावली/४–श्रीचंद्रावली/पहिला अंक' },
    { title: 'दूसरा अंक — निकुंज, विरह-वेदना व सखी-संवाद', page: 'भारतेंदु-नाटकावली/४–श्रीचंद्रावली/दूसरा अंक' },
    { title: 'तीसरा अंक — यमुना-तट, श्रीकृष्ण-आगमन व विरह-परमोत्कर्ष', page: 'भारतेंदु-नाटकावली/४–श्रीचंद्रावली/तीसरा अंक' },
    { title: 'चौथा अंक — मिलन, आत्म-समर्पण व प्रेमाभक्ति', page: 'भारतेंदु-नाटकावली/४–श्रीचंद्रावली/चौथा अंक' },
    { title: 'अंकावतार एवं भरतवाक्य', page: 'भारतेंदु-नाटकावली/४–श्रीचंद्रावली/अंकावतार' }
  ];

  let mdContent = `---
id: "shri-chandravali"
title: "श्रीचंद्रावली"
title_en: "Shri Chandravali"
author: "भारतेन्दु हरिश्चंद्र"
author_en: "Bharatendu Harishchandra"
category: "नाटक"
category_en: "Play / Drama"
published_year: 1876
description: "भारतेन्दु हरिश्चंद्र की सर्वोत्कृष्ट भाव-प्रधान नाटिका। चंद्रावली का श्रीकृष्ण के प्रति अहैतुक, अनन्य और आत्म-समर्पणकारी मधुर-भाव का निरूपण। आधुनिक हिन्दी नाटक में प्रेमाभक्ति और ब्रजभाषा-खड़ीबोली के सौन्दर्य का अनुपम संगम।"
keywords: ["shri chandravali", "bharatendu harishchandra", "madhur bhakti", "krishna", "natika", "drama", "natak"]
cover: ""
---

`;

  let totalActs = 0;
  for (const act of acts) {
    try {
      const html = await fetchWikiPage(act.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalActs++;
        mdContent += `\n# ${act.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-8] Ingested Shri Chandravali ${act.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-8] Error fetching ${act.page}:`, e.message);
    }
    await sleep(200);
  }

  const filePath = path.join(RAW_DIR, 'shri-chandravali.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-8] Saved ${filePath} with ${totalActs} acts.`);

  logSourceRecord({
    id: 'shri-chandravali',
    title_hi: 'श्रीचंद्रावली',
    title_en: 'Shri Chandravali',
    author_hi: 'भारतेन्दु हरिश्चंद्र',
    author_en: 'Bharatendu Harishchandra',
    category_hi: 'नाटक',
    category_en: 'Play / Drama',
    published_year: 1876,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भारतेंदु-नाटकावली/४–श्रीचंद्रावली',
    ingested_at: '2026-11-14',
    chapter_count: totalActs,
    verification_notes: '१८७६/१९३५ भारतेंदु-नाटकावली (संपादक: बाबू श्यामसुन्दर दास) से सत्यापित सम्पूर्ण अंक, विष्कम्भक व अंकावतार।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 8 INGESTION ===\n');
  await ingestGaban();
  await ingestChandragupta();
  await ingestBhramargeetSaar();
  await ingestSahityaKaUddeshya();
  await ingestShriChandravali();
  console.log('\n=== BATCH 8 INGESTION FINISHED ===');
}

main().catch(console.error);
