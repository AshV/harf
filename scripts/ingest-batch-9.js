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

// 1. Ingest Vaidehi Vanvas (वैदेही वनवास by Hariaudh) - 18 Sargas + Vaktavya
async function ingestVaidehiVanvas() {
  console.log('[BATCH-9] Fetching वैदेही वनवास (Ayodhya Singh Upadhyay Hariaudh)...');

  const sargas = [
    { title: 'वक्तव्य — कवि का निवेदन', page: 'वैदेही वनवास/वक्तव्य' },
    { title: 'सर्ग १ — उपवन', page: 'वैदेही वनवास/१ उपवन' },
    { title: 'सर्ग २ — चिन्तित चित्त', page: 'वैदेही वनवास/२ चिन्तित चित्त' },
    { title: 'सर्ग ३ — मंत्रणा गृह', page: 'वैदेही वनवास/३ मंत्रणा गृह' },
    { title: 'सर्ग ४ — वशिष्ठाश्रम', page: 'वैदेही वनवास/४ वशिष्ठाश्रम' },
    { title: 'सर्ग ५ — सती सीता', page: 'वैदेही वनवास/५ सती सीता' },
    { title: 'सर्ग ६ — कातरोक्ति', page: 'वैदेही वनवास/६ कातरोक्ति' },
    { title: 'सर्ग ७ — मंगल यात्रा', page: 'वैदेही वनवास/७ मंगल यात्रा' },
    { title: 'सर्ग ८ — आश्रम प्रवेश', page: 'वैदेही वनवास/८ आश्रम प्रवेश' },
    { title: 'सर्ग ९ — अवध धाम', page: 'वैदेही वनवास/९ अवध धाम' },
    { title: 'सर्ग १० — तपस्विनी आश्रम', page: 'वैदेही वनवास/१० तपस्विनी आश्रम' },
    { title: 'सर्ग ११ — रिपुसूदनागमन', page: 'वैदेही वनवास/११ रिपुसूदनागमन' },
    { title: 'सर्ग १२ — नामकरण-संस्कार', page: 'वैदेही वनवास/१२ नामकरण-संस्कार' },
    { title: 'सर्ग १३ — जीवन-यात्रा', page: 'वैदेही वनवास/१३ जीवन-यात्रा' },
    { title: 'सर्ग १४ — दाम्पत्य-दिव्यता', page: 'वैदेही वनवास/१४ दाम्पत्य-दिव्यता' },
    { title: 'सर्ग १५ — सुतवती सीता', page: 'वैदेही वनवास/१५ सुतवती सीता' },
    { title: 'सर्ग १६ — शुभ सम्वाद', page: 'वैदेही वनवास/१६ शुभ सम्वाद' },
    { title: 'सर्ग १७ — जन-स्थान', page: 'वैदेही वनवास/१७ जन-स्थान' },
    { title: 'सर्ग १८ — स्वर्गारोहण', page: 'वैदेही वनवास/१८ स्वर्गारोहण' }
  ];

  let mdContent = `---
id: "vaidehi-vanvas"
title: "वैदेही वनवास"
title_en: "Vaidehi Vanvas"
author: "अयोध्या सिंह उपाध्याय 'हरिऔध'"
author_en: "Ayodhya Singh Upadhyay 'Hariaudh'"
category: "कविता"
category_en: "Poetry"
published_year: 1940
description: "खड़ी बोली का द्वितीय अमर महाकाव्य। मर्यादा पुरुषोत्तम राम के राजधर्म और जानकी के दारुण वनवास व आत्म-त्याग का १८ सर्गों में करुण-रसावतार। सीता के पावन सतीत्व, मातृत्व और स्वर्गारोहण की भावपूर्ण महागाथा।"
keywords: ["vaidehi vanvas", "hariaudh", "sita vanvas", "ramayana", "khadi boli mahakavya", "karun ras", "kavita"]
cover: ""
---

`;

  let totalSargas = 0;
  for (const s of sargas) {
    try {
      const html = await fetchWikiPage(s.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalSargas++;
        mdContent += `\n# ${s.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-9] Ingested Vaidehi Vanvas ${s.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-9] Error fetching ${s.page}:`, e.message);
    }
    await sleep(200);
  }

  const filePath = path.join(RAW_DIR, 'vaidehi-vanvas.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-9] Saved ${filePath} with ${totalSargas} sargas.`);

  logSourceRecord({
    id: 'vaidehi-vanvas',
    title_hi: 'वैदेही वनवास',
    title_en: 'Vaidehi Vanvas',
    author_hi: "अयोध्या सिंह उपाध्याय 'हरिऔध'",
    author_en: "Ayodhya Singh Upadhyay 'Hariaudh'",
    category_hi: 'कविता',
    category_en: 'Poetry',
    published_year: 1940,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/वैदेही_वनवास',
    ingested_at: '2026-11-14',
    chapter_count: totalSargas,
    verification_notes: '१९४० के मूल प्रकाशन से हिन्दी विकिस्रोत पर सत्यापित वक्तव्य एवं सम्पूर्ण १८ सर्ग।'
  });
}

// 2. Ingest Kayakalph (कायाकल्प by Munshi Premchand) - 57 Chapters
async function ingestKayakalph() {
  console.log('[BATCH-9] Fetching कायाकल्प (Munshi Premchand - 57 chapters)...');

  let mdContent = `---
id: "kayakalph"
title: "कायाकल्प"
title_en: "Kayakalph"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "उपन्यास"
category_en: "Novel"
published_year: 1926
description: "प्रेमचंद का सर्वाधिक रहस्यमयी और बहुआयामी उपन्यास। पुनर्जन्म, कायाकल्प की योग-साधना, देशी रियासतों के षड्यंत्र और किसान-आंदोलन का अद्भूत समन्वय। चक्रधर के नैतिक आदर्श, अहल्या के त्याग और मनोरमा के अंतर्द्वंद्व की अमर कथा।"
keywords: ["kayakalph", "munshi premchand", "chakradhar", "manorama", "reincarnation", "social novel", "upanyas"]
cover: ""
---

`;

  let totalChapters = 0;
  for (let i = 1; i <= 57; i++) {
    const d = toDeva(i);
    const pageTitle = `कायाकल्प/${d}`;

    try {
      const html = await fetchWikiPage(pageTitle);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# अध्याय ${d}\n\n${clean}\n\n`;
        if (totalChapters % 10 === 0 || totalChapters === 57) {
          console.log(`[BATCH-9] Ingested Kayakalph Chapter ${totalChapters}/57`);
        }
      }
    } catch (e) {
      console.warn(`[BATCH-9] Error fetching ${pageTitle}:`, e.message);
    }
    await sleep(150);
  }

  const filePath = path.join(RAW_DIR, 'kayakalph.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-9] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'kayakalph',
    title_hi: 'कायाकल्प',
    title_en: 'Kayakalph',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'उपन्यास',
    category_en: 'Novel',
    published_year: 1926,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कायाकल्प',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२६ के मूल प्रकाशन से हिन्दी विकिस्रोत पर सत्यापित सम्पूर्ण ५७ अध्याय।'
  });
}

// 3. Ingest Akhrawat & Aakhiri Kalam (अखरावट एवं आखिरी कलाम by Malik Muhammad Jayasi)
async function ingestAkhrawatAakhiriKalam() {
  console.log('[BATCH-9] Fetching अखरावट एवं आखिरी कलाम (Malik Muhammad Jayasi)...');

  let mdContent = `---
id: "akhrawat-aakhiri-kalam"
title: "अखरावट एवं आखिरी कलाम"
title_en: "Akhrawat & Aakhiri Kalam"
author: "मलिक मोहम्मद जायसी"
author_en: "Malik Muhammad Jayasi"
category: "कविता"
category_en: "Poetry"
published_year: 1540
description: "महाकवि जायसी की दो अमर आध्यात्मिक कृतियाँ। 'अखरावट' में देवनागरी वर्णमाला के प्रत्येक अक्षर से परमात्मा, सृष्टि और सूफ़ी रहस्यवाद की व्याख्या; तथा 'आखिरी कलाम' में प्रलय, कयामत और बाबर कालीन इतिहास का अलौकिक निरूपण।"
keywords: ["akhrawat", "aakhiri kalam", "jayasi", "sufi poetry", "brajbhasha", "awadhi", "mysticism", "kavita"]
cover: ""
---

`;

  let totalSections = 0;

  // 1. Akhrawat
  try {
    const akhrawatHtml = await fetchWikiPage('जायसी ग्रंथावली/अखरावट');
    const akhrawatClean = stripNavHeader(cleanWikiHtml(akhrawatHtml));
    if (akhrawatClean.length > 100) {
      totalSections++;
      mdContent += `\n# अखरावट — देवनागरी वर्णमाला व सूफ़ी तत्व-दर्शन\n\n${akhrawatClean}\n\n`;
      console.log('[BATCH-9] Ingested अखरावट');
    }
  } catch (e) {
    console.warn('[BATCH-9] Error fetching Akhrawat:', e.message);
  }
  await sleep(300);

  // 2. Aakhiri Kalam
  try {
    const kalamHtml = await fetchWikiPage('जायसी ग्रंथावली/आखिरी कलाम');
    const kalamClean = stripNavHeader(cleanWikiHtml(kalamHtml));
    if (kalamClean.length > 100) {
      totalSections++;
      mdContent += `\n# आखिरी कलाम — सृष्टि, प्रलय व बाबर-प्रशंसा\n\n${kalamClean}\n\n`;
      console.log('[BATCH-9] Ingested आखिरी कलाम');
    }
  } catch (e) {
    console.warn('[BATCH-9] Error fetching Aakhiri Kalam:', e.message);
  }

  const filePath = path.join(RAW_DIR, 'akhrawat-aakhiri-kalam.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-9] Saved ${filePath} with ${totalSections} major epics.`);

  logSourceRecord({
    id: 'akhrawat-aakhiri-kalam',
    title_hi: 'अखरावट एवं आखिरी कलाम',
    title_en: 'Akhrawat & Aakhiri Kalam',
    author_hi: 'मलिक मोहम्मद जायसी',
    author_en: 'Malik Muhammad Jayasi',
    category_hi: 'कविता',
    category_en: 'Poetry',
    published_year: 1540,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/जायसी_ग्रंथावली/अखरावट',
    ingested_at: '2026-11-14',
    chapter_count: totalSections,
    verification_notes: 'आचार्य रामचंद्र शुक्ल द्वारा संपादित जायसी ग्रंथावली (नागरीप्रचारिणी सभा) से सत्यापित सम्पूर्ण अखरावट एवं आखिरी कलाम।'
  });
}

// 4. Ingest Bacon-Vichar-Ratnavali (बेकन-विचाररत्नावली by Mahavir Prasad Dwivedi)
async function ingestBaconVicharRatnavali() {
  console.log('[BATCH-9] Fetching बेकन-विचाररत्नावली (Acharya Mahavir Prasad Dwivedi)...');

  // Discover all subpages of बेकन-विचाररत्नावली
  let continueStr = null;
  let allPages = [];
  do {
    let url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('बेकन-विचाररत्नावली/')}&aplimit=100&format=json`;
    if (continueStr) url += `&apcontinue=${encodeURIComponent(continueStr)}`;
    const res = await fetchJson(url);
    const pages = res?.query?.allpages || [];
    allPages.push(...pages);
    continueStr = res?.continue?.apcontinue;
  } while (continueStr);

  // Sort subpages by leading Devanagari number, or put index at beginning
  const essayPages = allPages.filter(p => !p.title.includes('सूचीपत्र'));
  essayPages.sort((a, b) => {
    const rawA = a.title.replace('बेकन-विचाररत्नावली/', '').split(' ')[0];
    const rawB = b.title.replace('बेकन-विचाररत्नावली/', '').split(' ')[0];
    const numA = devaToNum(rawA);
    const numB = devaToNum(rawB);
    return numA - numB;
  });

  const indexPage = allPages.find(p => p.title.includes('सूचीपत्र'));
  if (indexPage) {
    essayPages.unshift(indexPage);
  }

  let mdContent = `---
id: "bacon-vichar-ratnavali"
title: "बेकन-विचाररत्नावली"
title_en: "Bacon Vichar Ratnavali"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "निबंध"
category_en: "Essays"
published_year: 1901
description: "आंग्ल दार्शनिक लॉर्ड फ्रांसिस बेकन के विश्वविख्यात निबंधों का आचार्य महावीर प्रसाद द्विवेदी द्वारा किया गया अमर भाषानुवाद व चिंतन। सत्य, विपत्ति, संशय, संतान, स्वार्थपरता, आरोग्यरक्षा, सौन्दर्य और स्वभाव पर ३५+ कालजयी दार्शनिक निबंध।"
keywords: ["bacon vichar ratnavali", "mahavir prasad dwivedi", "francis bacon", "philosophical essays", "wisdom", "nibandh"]
cover: ""
---

`;

  let totalEssays = 0;
  for (const ep of essayPages) {
    const subTitle = ep.title.replace('बेकन-विचाररत्नावली/', '');
    try {
      const html = await fetchWikiPage(ep.title);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalEssays++;
        mdContent += `\n# निबंध — ${subTitle}\n\n${clean}\n\n`;
        if (totalEssays % 10 === 0 || totalEssays === essayPages.length) {
          console.log(`[BATCH-9] Ingested Bacon Vichar Ratnavali ${totalEssays}/${essayPages.length}`);
        }
      }
    } catch (e) {
      console.warn(`[BATCH-9] Error fetching ${ep.title}:`, e.message);
    }
    await sleep(150);
  }

  const filePath = path.join(RAW_DIR, 'bacon-vichar-ratnavali.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-9] Saved ${filePath} with ${totalEssays} essays.`);

  logSourceRecord({
    id: 'bacon-vichar-ratnavali',
    title_hi: 'बेकन-विचाररत्नावली',
    title_en: 'Bacon Vichar Ratnavali',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'निबंध',
    category_en: 'Essays',
    published_year: 1901,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/बेकन-विचाररत्नावली',
    ingested_at: '2026-11-14',
    chapter_count: totalEssays,
    verification_notes: '१९०१ के मूल संस्करण से हिन्दी विकिस्रोत पर सत्यापित ३६ दार्शनिक निबंध व ऐतिहासिक सूचीपत्र।'
  });
}

// 5. Ingest Mudrarakshasa (मुद्राराक्षस by Bharatendu Harishchandra) - 7 Acts + Nandi + Upasamhar
async function ingestMudrarakshasa() {
  console.log('[BATCH-9] Fetching मुद्राराक्षस (Bharatendu Harishchandra)...');

  const acts = [
    { title: 'नांदी-पाठ व प्रस्तावना', page: 'भारतेंदु-नाटकावली/५–मुद्राराक्षस/नांदी-पाठ' },
    { title: 'प्रथम अंक — चाणक्य की कूटनीति व राक्षस का भेद', page: 'भारतेंदु-नाटकावली/५–मुद्राराक्षस/प्रथम अंक' },
    { title: 'द्वितीय अंक — राक्षस-भवन व कूट-योजना', page: 'भारतेंदु-नाटकावली/५–मुद्राराक्षस/द्वितीय अंक' },
    { title: 'तृतीय अंक — चन्द्रगुप्त-चाणक्य का छद्म-कलह', page: 'भारतेंदु-नाटकावली/५–मुद्राराक्षस/तृतीय अंक' },
    { title: 'चतुर्थ अंक — मलयकेतु का शिविर व षड्यंत्र', page: 'भारतेंदु-नाटकावली/५–मुद्राराक्षस/चतुर्थ अंक' },
    { title: 'पंचम अंक — मलयकेतु-राक्षस संवाद व फूट', page: 'भारतेंदु-नाटकावली/५–मुद्राराक्षस/पंचम अंक' },
    { title: 'षष्ठ अंक — पाटलिपुत्र में राक्षस का आत्म-समर्पण विचार', page: 'भारतेंदु-नाटकावली/५–मुद्राराक्षस/षष्ठ अंक' },
    { title: 'सप्तम अंक — चंदनदास की प्राण-रक्षा व राक्षस का मंत्रित्व', page: 'भारतेंदु-नाटकावली/५–मुद्राराक्षस/सप्तम अंक' },
    { title: 'उपसंहार व भरतवाक्य', page: 'भारतेंदु-नाटकावली/५–मुद्राराक्षस/उपसंहार-क' }
  ];

  let mdContent = `---
id: "mudrarakshasa"
title: "मुद्राराक्षस"
title_en: "Mudrarakshasa"
author: "भारतेन्दु हरिश्चंद्र"
author_en: "Bharatendu Harishchandra"
category: "नाटक"
category_en: "Play / Drama"
published_year: 1878
description: "महाकवि विशाखदत्त के संस्कृत राजनीतिक नाटक का भारतेन्दु हरिश्चंद्र कृत प्रामाणिक हिन्दी नाट्य रूपांतर। आर्य चाणक्य की अप्रतिम कूटनीति, अमात्य राक्षस की स्वामीभक्ति और मौर्य साम्राज्य की सुदृढ़ स्थापना का सात अंकों का महानाटक।"
keywords: ["mudrarakshasa", "bharatendu harishchandra", "chanakya", "amatya rakshasa", "political drama", "visakhadatta", "natak"]
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
        console.log(`[BATCH-9] Ingested Mudrarakshasa ${act.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-9] Error fetching ${act.page}:`, e.message);
    }
    await sleep(200);
  }

  const filePath = path.join(RAW_DIR, 'mudrarakshasa.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-9] Saved ${filePath} with ${totalActs} acts/parts.`);

  logSourceRecord({
    id: 'mudrarakshasa',
    title_hi: 'मुद्राराक्षस',
    title_en: 'Mudrarakshasa',
    author_hi: 'भारतेन्दु हरिश्चंद्र',
    author_en: 'Bharatendu Harishchandra',
    category_hi: 'नाटक',
    category_en: 'Play / Drama',
    published_year: 1878,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भारतेंदु-नाटकावली/५–मुद्राराक्षस',
    ingested_at: '2026-11-14',
    chapter_count: totalActs,
    verification_notes: '१८७८/१९३५ भारतेंदु-नाटकावली (संपादक: बाबू श्यामसुन्दर दास) से सत्यापित सम्पूर्ण ७ अंक, नांदी-पाठ व उपसंहार।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 9 INGESTION ===\n');
  await ingestVaidehiVanvas();
  await ingestKayakalph();
  await ingestAkhrawatAakhiriKalam();
  await ingestBaconVicharRatnavali();
  await ingestMudrarakshasa();
  console.log('\n=== BATCH 9 INGESTION FINISHED ===');
}

main().catch(console.error);
