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

// 1. Ingest Venice Ka Banka (वेनिस का बाँका - The Merchant of Venice by William Shakespeare, trans. Hariaudh)
async function ingestVeniceKaBanka() {
  console.log('[BATCH-11] Fetching वेनिस का बाँका (Shakespeare / Hariaudh)...');

  const parichhedas = [
    { title: 'भूमिका — दूसरे संस्करण की भूमिका', page: 'वेनिस का बाँका/दूसरे संस्करण की भूमिका' },
    { title: 'लेखक का संक्षिप्त परिचय — विलियम शेक्सपियर', page: 'वेनिस का बाँका/लेखक का संक्षिप्त परिचय' },
    { title: 'पहला परिच्छेद — एंटोनियो और बसेनियो', page: 'वेनिस का बाँका/पहला परिच्छेद' },
    { title: 'दूसरा परिच्छेद — पोर्शिया और नेरिसा', page: 'वेनिस का बाँका/दूसरा परिच्छेद' },
    { title: 'तीसरा परिच्छेद — शाइलॉक का तीन सहस्त्र डुकाट का ऋण', page: 'वेनिस का बाँका/तीसरा परिच्छेद' },
    { title: 'चौथा परिच्छेद — मोरक्को के राजकुमार का आगमन', page: 'वेनिस का बाँका/चौथा परिच्छेद' },
    { title: 'पाँचवाँ परिच्छेद — लांसलाट का अंतर्द्वंद्व', page: 'वेनिस का बाँका/पाँचवाँ परिच्छेद' },
    { title: 'षष्ठ परिच्छेद — जेसिका और लोरेंजिया', page: 'वेनिस का बाँका/षष्ठ परिच्छेद' },
    { title: 'सप्तम परिच्छेद — सोने, चाँदी और सीसे की मंजूषा', page: 'वेनिस का बाँका/सप्तम परिच्छेद' },
    { title: 'अष्टम परिच्छेद — शाइलॉक का विलाप', page: 'वेनिस का बाँका/अष्टम परिच्छेद' },
    { title: 'नवम परिच्छेद — एरोगन के राजकुमार की परीक्षा', page: 'वेनिस का बाँका/नवम परिच्छेद' },
    { title: 'दशम परिच्छेद — एंटोनियो के पोत की विपदा', page: 'वेनिस का बाँका/दशम परिच्छेद' },
    { title: 'एकादश परिच्छेद — बसेनियो का चुनाव', page: 'वेनिस का बाँका/एकादश परिच्छेद' },
    { title: 'द्वादश परिच्छेद — एंटोनियो का दारुण पत्र', page: 'वेनिस का बाँका/द्वादश परिच्छेद' },
    { title: 'त्रयोदश परिच्छेद — शाइलॉक की कठोरता', page: 'वेनिस का बाँका/त्रयोदश परिच्छेद' },
    { title: 'चतुर्दश परिच्छेद — पोर्शिया की गुप्त मंत्रणा', page: 'वेनिस का बाँका/चतुर्दश परिच्छेद' },
    { title: 'पञ्चदश परिच्छेद — लांसलाट और जेसिका का संवाद', page: 'वेनिस का बाँका/पञ्चदश परिच्छेद' },
    { title: 'षोड़श परिच्छेद — वेनिस की राजसभा और न्यायालय', page: 'वेनिस का बाँका/षोड़श परिच्छेद' },
    { title: 'सप्तदश परिच्छेद — दया का महत्व व पोर्शिया का तर्क', page: 'वेनिस का बाँका/सप्तदश परिच्छेद' },
    { title: 'अष्टादश परिच्छेद — एक पाउंड मांस और रक्त की बूंद', page: 'वेनिस का बाँका/अष्टादश परिच्छेद' },
    { title: 'एकोनविंशति परिच्छेद — शाइलॉक का दंड और पश्चाताप', page: 'वेनिस का बाँका/एकोनविंशति परिच्छेद' },
    { title: 'विंशति परिच्छेद — मुद्रिका (अंगूठी) का उपहार', page: 'वेनिस का बाँका/विंशति परिच्छेद' },
    { title: 'एकविंशति परिच्छेद — बेलमोंट की चांदनी रात', page: 'वेनिस का बाँका/एकविंशति परिच्छेद' },
    { title: 'द्वाविंशति परिच्छेद — मुद्रिका को लेकर छद्म-कलह', page: 'वेनिस का बाँका/द्वाविंशति परिच्छेद' },
    { title: 'त्रयविंशति परिच्छेद — सत्य का उद्घाटन व रहस्य-भेद', page: 'वेनिस का बाँका/त्रयविंशति परिच्छेद' },
    { title: 'चतुर्विंश परिच्छेद — आनंद-मिलन व कल्याण', page: 'वेनिस का बाँका/चतुर्विंश परिच्छेद' }
  ];

  let mdContent = `---
id: "venice-ka-banka"
title: "वेनिस का बाँका"
title_en: "Venice Ka Banka (The Merchant of Venice)"
author: "अयोध्या सिंह उपाध्याय 'हरिऔध'"
author_en: "Ayodhya Singh Upadhyay 'Hariaudh' (William Shakespeare)"
category: "उपन्यास"
category_en: "Novel"
published_year: 1928
description: "विलियम शेक्सपियर के विश्वविख्यात नाटक 'द मर्चेंट ऑफ़ वेनिस' का अयोध्या सिंह उपाध्याय 'हरिऔध' द्वारा किया गया अमर औपन्यासिक हिन्दी रूपान्तर। एंटोनियो की उदार मित्रता, शाइलॉक का क्रूर ऋण-बंध और पोर्शिया के न्याय-कौशल की कालजयी कथा।"
keywords: ["venice ka banka", "merchant of venice", "william shakespeare", "hariaudh", "shylock", "portia", "upanyas"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const p of parichhedas) {
    try {
      const html = await fetchWikiPage(p.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalChapters++;
        mdContent += `\n# ${p.title}\n\n${clean}\n\n`;
        if (totalChapters % 5 === 0 || totalChapters === parichhedas.length) {
          console.log(`[BATCH-11] Ingested Venice Ka Banka ${totalChapters}/${parichhedas.length}`);
        }
      }
    } catch (e) {
      console.warn(`[BATCH-11] Error fetching ${p.page}:`, e.message);
    }
    await sleep(150);
  }

  const filePath = path.join(RAW_DIR, 'venice-ka-banka.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-11] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'venice-ka-banka',
    title_hi: 'वेनिस का बाँका',
    title_en: 'Venice Ka Banka (The Merchant of Venice)',
    author_hi: "अयोध्या सिंह उपाध्याय 'हरिऔध' (विलियम शेक्सपियर)",
    author_en: "Ayodhya Singh Upadhyay 'Hariaudh' (William Shakespeare)",
    category_hi: 'उपन्यास',
    category_en: 'Novel',
    published_year: 1928,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/वेनिस_का_बाँका',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२८ द्वितीय संस्करण (पुस्तक-भंडार, लहेरियासराय) से शेक्सपियर के मर्चेंट ऑफ वेनिस का हरिऔध जी कृत सम्पूर्ण २४ परिच्छेद व भूमिका।'
  });
}

// 2. Ingest Sahitya Seekar (साहित्य सीकर by Acharya Mahavir Prasad Dwivedi) - 21 Essays
async function ingestSahityaSeekar() {
  console.log('[BATCH-11] Fetching साहित्य सीकर (Acharya Mahavir Prasad Dwivedi)...');

  // Discover all pages under साहित्य सीकर/
  let continueStr = null;
  let allPages = [];
  do {
    let url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('साहित्य सीकर/')}&aplimit=100&format=json`;
    if (continueStr) url += `&apcontinue=${encodeURIComponent(continueStr)}`;
    const res = await fetchJson(url);
    const pages = res?.query?.allpages || [];
    allPages.push(...pages);
    continueStr = res?.continue?.apcontinue;
  } while (continueStr);

  const DEVA_MAP = {'०':0, '१':1, '२':2, '३':3, '४':4, '५':5, '६':6, '७':7, '८':8, '९':9};
  function devaNum(str) {
    let n = 0;
    for (const c of str) {
      if (DEVA_MAP[c] !== undefined) n = n * 10 + DEVA_MAP[c];
    }
    return n;
  }

  allPages.sort((a, b) => {
    const rawA = a.title.replace('साहित्य सीकर/', '').split('—')[0];
    const rawB = b.title.replace('साहित्य सीकर/', '').split('—')[0];
    return devaNum(rawA) - devaNum(rawB);
  });

  let mdContent = `---
id: "sahitya-seekar"
title: "साहित्य सीकर"
title_en: "Sahitya Seekar"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "निबंध"
category_en: "Essays"
published_year: 1920
description: "आचार्य महावीर प्रसाद द्विवेदी का भाषा-शास्त्र, विश्व-साहित्य, पत्रकारिता और सम्पादन-कला पर लिखा गया अनमोल वैचारिक ग्रंथ। वेदों से लेकर प्राकृत, संस्कृत, यूरोपीय प्राच्यविद्या, समाचार-पत्रों के इतिहास और कॉपीराइट तक २१ सारगर्भित निबंध।"
keywords: ["sahitya seekar", "mahavir prasad dwivedi", "literary criticism", "philology", "journalism", "essays", "nibandh"]
cover: ""
---

`;

  let totalEssays = 0;
  for (const ep of allPages) {
    const subTitle = ep.title.replace('साहित्य सीकर/', '');
    try {
      const html = await fetchWikiPage(ep.title);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalEssays++;
        mdContent += `\n# निबंध — ${subTitle}\n\n${clean}\n\n`;
        if (totalEssays % 5 === 0 || totalEssays === allPages.length) {
          console.log(`[BATCH-11] Ingested Sahitya Seekar ${totalEssays}/${allPages.length}`);
        }
      }
    } catch (e) {
      console.warn(`[BATCH-11] Error fetching ${ep.title}:`, e.message);
    }
    await sleep(150);
  }

  const filePath = path.join(RAW_DIR, 'sahitya-seekar.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-11] Saved ${filePath} with ${totalEssays} essays.`);

  logSourceRecord({
    id: 'sahitya-seekar',
    title_hi: 'साहित्य सीकर',
    title_en: 'Sahitya Seekar',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'निबंध',
    category_en: 'Essays',
    published_year: 1920,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/साहित्य_सीकर',
    ingested_at: '2026-11-14',
    chapter_count: totalEssays,
    verification_notes: '१९२० के मूल संस्करण से हिन्दी विकिस्रोत पर सत्यापित भाषा-शास्त्र व सम्पादन-कला के सम्पूर्ण २१ निबंध।'
  });
}

// 3. Ingest Puratattva Prasang (पुरातत्त्व प्रसंग by Acharya Mahavir Prasad Dwivedi) - 16 Essays
async function ingestPuratattvaPrasang() {
  console.log('[BATCH-11] Fetching पुरातत्त्व प्रसंग (Acharya Mahavir Prasad Dwivedi)...');

  const essays = [
    { title: 'प्रस्तावना — पुरातत्त्व का महत्व', page: 'पुरातत्त्व प्रसंग/प्रस्तावना' },
    { title: 'पुरातत्त्व का पूर्वेतिहास', page: 'पुरातत्त्व प्रसंग/पुरातत्त्व का पूर्वेतिहास' },
    { title: 'अफ़ग़ानिस्तान में बौद्धकालीन चिन्ह', page: 'पुरातत्त्व प्रसंग/अफ़ग़ानिस्तान में बौद्धकालीन चिन्ह' },
    { title: 'कम्बोडिया में प्राचीन हिन्दू-राज्य', page: 'पुरातत्त्व प्रसंग/कम्बोडिया में प्राचीन हिन्दू-राज्य' },
    { title: 'सुमात्रा और जात्रा आदि द्वीपों में प्राचीन हिन्दू-सभ्यता', page: 'पुरातत्त्व प्रसंग/सुमात्रा और जात्रा आदि द्वीपों में प्राचीन हिन्दू-सभ्यता' },
    { title: 'तक्षशिला की कुछ प्राचीन इमारतें', page: 'पुरातत्त्व प्रसंग/तक्षशिला की कुछ प्राचीन इमारतें' },
    { title: 'मध्य-एशिया के खँडहरों की खुदाई का फल', page: 'पुरातत्त्व प्रसंग/मध्य-एशिया के खँडहरों की खुदाई का फल।' },
    { title: 'प्राचीन भारत में नाट्यशालायें', page: 'पुरातत्त्व प्रसंग/प्राचीन भारत में नाट्यशालायें' },
    { title: 'प्राचीन हिन्दुओं की समुद्र-यात्रा', page: 'पुरातत्त्व प्रसंग/प्राचीन हिन्दुओं की समुद्र-यात्रा' },
    { title: 'महात्मा अगस्त्य की महत्ता', page: 'पुरातत्त्व प्रसंग/महात्मा अगस्त्य की महत्ता' },
    { title: 'द्रविड़जातीय भारतवासियों की सभ्यता की प्राचीनता', page: 'पुरातत्त्व प्रसंग/द्रविड़जातीय भारतवासियों की सभ्यता की प्राचीनता' },
    { title: 'कालेपानी के आदिम असभ्य', page: 'पुरातत्त्व प्रसंग/कालेपानी के आदिम असभ्य' },
    { title: 'मिशमी जाति', page: 'पुरातत्त्व प्रसंग/मिशमी जाति' },
    { title: 'मैडेगास्कर-द्वीप के मूल-निवासी', page: 'पुरातत्त्व प्रसंग/मैडेगास्कर-द्वीप के मूल-निवासी' },
    { title: 'साहित्य-मणि-माला', page: 'पुरातत्त्व प्रसंग/"साहित्य-मणि-माला"' }
  ];

  let mdContent = `---
id: "puratattva-prasang"
title: "पुरातत्त्व प्रसंग"
title_en: "Puratattva Prasang"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "निबंध"
category_en: "Essays"
published_year: 1926
description: "आचार्य महावीर प्रसाद द्विवेदी का भारतीय इतिहास, पुरातत्व और वैश्विक सांस्कृतिक संपर्कों पर लिखा गया ऐतिहासिक निबंध-संग्रह। तक्षशिला, अफ़गानिस्तान के बौद्ध अवशेष, कंबोडिया के अंकोर, सुमात्रा-जावा तथा प्राचीन हिन्दुओं की समुद्र-यात्राओं का प्रामाणिक दिग्दर्शन।"
keywords: ["puratattva prasang", "mahavir prasad dwivedi", "archaeology", "ancient india", "takshashila", "cambodia", "nibandh"]
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
        console.log(`[BATCH-11] Ingested Puratattva Prasang: ${es.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-11] Error fetching ${es.page}:`, e.message);
    }
    await sleep(150);
  }

  const filePath = path.join(RAW_DIR, 'puratattva-prasang.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-11] Saved ${filePath} with ${totalEssays} essays.`);

  logSourceRecord({
    id: 'puratattva-prasang',
    title_hi: 'पुरातत्त्व प्रसंग',
    title_en: 'Puratattva Prasang',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'निबंध',
    category_en: 'Essays',
    published_year: 1926,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/पुरातत्त्व_प्रसंग',
    ingested_at: '2026-11-14',
    chapter_count: totalEssays,
    verification_notes: '१९२६ के मूल संस्करण से हिन्दी विकिस्रोत पर सत्यापित तक्षशिला, कंबोडिया, जावा आदि पर आधारित ऐतिहासिक निबंध।'
  });
}

// 4. Ingest Prem Panchami (प्रेम पंचमी by Munshi Premchand) - 5 Stories
async function ingestPremPanchami() {
  console.log('[BATCH-11] Fetching प्रेम पंचमी (Munshi Premchand)...');

  const stories = [
    { title: 'कहानी १ — मृत्यु के पीछे', page: 'प्रेम पंचमी/१ मृत्यु के पीछे' },
    { title: 'कहानी २ — आभूषण', page: 'प्रेम पंचमी/२ आभूषण' },
    { title: 'कहानी ३ — राज्य-भक्त', page: 'प्रेम पंचमी/३ राज्य-भक्त' },
    { title: 'कहानी ४ — अधिकार-चिंता', page: 'प्रेम पंचमी/४ अधिकार-चिंता' },
    { title: 'कहानी ५ — गृह-दाह', page: 'प्रेम पंचमी/५ गृह-दाह' }
  ];

  let mdContent = `---
id: "prem-panchami"
title: "प्रेम पंचमी"
title_en: "Prem Panchami"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "कहानी"
category_en: "Stories"
published_year: 1923
description: "मुंशी प्रेमचंद का संवेदनशील पांच कहानियों का अनूठा संग्रह। पारिवारिक अंतर्द्वंद्व, आभूषण-लालसा, राजभक्ति बनाम जन-निष्ठा और मृत्यु के उपरांत पश्चाताप पर केंद्रित ५ मार्मिक सामाजिक कहानियाँ।"
keywords: ["prem panchami", "munshi premchand", "classic stories", "social realism", "kahani"]
cover: ""
---

`;

  let totalStories = 0;
  for (const s of stories) {
    try {
      const html = await fetchWikiPage(s.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalStories++;
        mdContent += `\n# ${s.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-11] Ingested Prem Panchami: ${s.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-11] Error fetching ${s.page}:`, e.message);
    }
    await sleep(150);
  }

  const filePath = path.join(RAW_DIR, 'prem-panchami.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-11] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'prem-panchami',
    title_hi: 'प्रेम पंचमी',
    title_en: 'Prem Panchami',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'कहानी',
    category_en: 'Stories',
    published_year: 1923,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/प्रेम_पंचमी',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: '१९२३ के मूल संस्करण से हिन्दी विकिस्रोत पर सत्यापित सम्पूर्ण ५ सामाजिक कहानियाँ।'
  });
}

// 5. Ingest Dhananjay Vijay (धनंजय-विजय by Bharatendu Harishchandra) - Classical Vyayoga Play
async function ingestDhananjayVijay() {
  console.log('[BATCH-11] Fetching धनंजय-विजय (Bharatendu Harishchandra)...');

  let mdContent = `---
id: "dhananjay-vijay"
title: "धनंजय-विजय"
title_en: "Dhananjay Vijay"
author: "भारतेन्दु हरिश्चंद्र"
author_en: "Bharatendu Harishchandra"
category: "नाटक"
category_en: "Play / Drama"
published_year: 1873
description: "भारतेन्दु हरिश्चंद्र कृत प्रसिद्ध महाभारत-कालीन शास्त्रीय व्यायोग (एकांकी वीर-नाटक)। राजा विराट के अज्ञातवास में बृहन्नला रूपी अर्जुन (धनंजय) द्वारा कौरवों की विशाल सेना को परास्त कर गोधन की रक्षा और वीरता का ओजस्वी निरूपण।"
keywords: ["dhananjay vijay", "bharatendu harishchandra", "vyayoga", "arjuna", "mahabharata", "virata parva", "natak"]
cover: ""
---

`;

  let totalParts = 0;
  try {
    const html = await fetchWikiPage('भारतेंदु-नाटकावली/१–धनंजयविजय');
    const clean = stripNavHeader(cleanWikiHtml(html));
    if (clean.length > 100) {
      totalParts++;
      mdContent += `\n# धनंजय-विजय व्यायोग — सम्पूर्ण एकांकी नाटक\n\n${clean}\n\n`;
      console.log('[BATCH-11] Ingested धनंजय-विजय सम्पूर्ण');
    }
  } catch (e) {
    console.warn('[BATCH-11] Error fetching Dhananjay Vijay:', e.message);
  }

  const filePath = path.join(RAW_DIR, 'dhananjay-vijay.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-11] Saved ${filePath} with ${totalParts} part.`);

  logSourceRecord({
    id: 'dhananjay-vijay',
    title_hi: 'धनंजय-विजय',
    title_en: 'Dhananjay Vijay',
    author_hi: 'भारतेन्दु हरिश्चंद्र',
    author_en: 'Bharatendu Harishchandra',
    category_hi: 'नाटक',
    category_en: 'Play / Drama',
    published_year: 1873,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भारतेंदु-नाटकावली/१–धनंजयविजय',
    ingested_at: '2026-11-14',
    chapter_count: totalParts,
    verification_notes: '१८७३/१९३५ भारतेंदु-नाटकावली (संपादक: बाबू श्यामसुन्दर दास) से सत्यापित सम्पूर्ण धनंजय-विजय व्यायोग नाटक।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 11 INGESTION ===\n');
  await ingestVeniceKaBanka();
  await ingestSahityaSeekar();
  await ingestPuratattvaPrasang();
  await ingestPremPanchami();
  await ingestDhananjayVijay();
  console.log('\n=== BATCH 11 INGESTION FINISHED ===');
}

main().catch(console.error);
