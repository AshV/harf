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

function cleanBatch24Text(text) {
  if (!text) return '';
  let cleaned = text;

  // Remove multi-line navigation headers at start
  while (true) {
    const next = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|पीछे|मुखपृष्ठ|मुख्यपृष्ठ|भूमिका|मङ्गलाचरण|अगला भाग|अगला अध्याय|पिछला अध्याय|\(\d{4}\)|कवि-रहस्य|हिंदी भाषा और उसके साहित्य का विकास|कोविद-कीर्तन|प्राचीन चिह्न|विदेशी विद्वान्)[^\n]*?\n+/i, '');
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

// 1. Ingest Kavi-Rahasya (कवि-रहस्य - डॉ. गंगानाथ झा)
async function ingestKaviRahasya() {
  console.log('[BATCH-24] 1/5 Fetching कवि-रहस्य (डॉ. गंगानाथ झा)...');

  const canonicalOrder = [
    { page: 'कवि-रहस्य/काव्य की उत्पत्ति', title: 'काव्य की उत्पत्ति' },
    { page: 'कवि-रहस्य/वाङमय स्वरूप', title: 'वाङ्मय स्वरूप' },
    { page: 'कवि-रहस्य/शिष्य भेद', title: 'शिष्य भेद' },
    { page: "कवि-रहस्य/'काव्य पुरुष'-'साहित्य वधू'-संयोग", title: 'काव्य पुरुष व साहित्य वधू संयोग' },
    { page: "कवि-रहस्य/5 'कवि' लक्षण तथा भेद", title: 'कवि लक्षण तथा भेद' },
    { page: 'कवि-रहस्य/6 शब्द स्वरूप', title: 'शब्द स्वरूप' },
    { page: 'कवि-रहस्य/7 काव्य पढ़ने के ढंग', title: 'काव्य पढ़ने के ढंग' },
    { page: 'कवि-रहस्य/8 काव्यार्थ के मूल', title: 'काव्यार्थ के मूल स्रोत' },
    { page: 'कवि-रहस्य/9 साहित्य का विषय', title: 'साहित्य का विषय' },
    { page: 'कवि-रहस्य/10 कवि का कर्तव्य', title: 'कवि का कर्तव्य व कविचर्या' },
    { page: 'कवि-रहस्य/11 कवित्व-शिक्षा', title: 'कवित्व-शिक्षा' },
    { page: 'कवि-रहस्य/12 राजा का कर्तव्य', title: 'राजा का कर्तव्य व राजचर्या' },
    { page: 'कवि-रहस्य/13 चोरी', title: 'काव्य-हरण व शब्द-चौर्य विचार' },
    { page: 'कवि-रहस्य/14 कवि समय', title: 'कवि-समय व काव्य-रूढ़ियाँ' },
    { page: 'कवि-रहस्य/15 देश-विभाग', title: 'भौगोलिक देश-विभाग' },
    { page: 'कवि-रहस्य/16 काल-विभाग', title: 'काल व ऋतु-विभाग' },
    { page: 'कवि-रहस्य/17 नाना शास्त्र परिचय', title: 'नाना शास्त्र व विद्या-परिचय' }
  ];

  let mdContent = `---
id: "kavi-rahasya"
title: "कवि-रहस्य"
title_en: "Kavi-Rahasya"
author: "डॉ. गंगानाथ झा"
author_en: "Dr. Ganganath Jha"
category: "निबंध व विमर्श"
category_en: "Classical Poetics, Aesthetics & Literary Theory"
published_year: 1929
description: "महामहोपाध्याय डॉ. गंगानाथ झा (१८७१–१९४१) द्वारा विरचित आचार्य राजशेखर की 'काव्यमीमांसा' का सर्वोत्कृष्ट शास्त्रीय हिन्दी रूपान्तर। काव्य की उत्पत्ति, वाङ्मय स्वरूप, काव्य-पुरुष व साहित्य-वधू संयोग, कवि-लक्षण, कवित्व-शिक्षा, काव्य-हरण (चौर्य) विवेक, कवि-समय, देश-विभाग और काल-विभाग का १७ अध्यायों में गहन शास्त्रीय निरूपण।"
keywords: ["kavi rahasya", "ganganath jha", "rajashekhara", "kavyamimamsa", "sanskrit poetics", "literary theory", "aesthetics"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of canonicalOrder) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch24Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-24] Ingested Kavi-Rahasya chapter ${totalChapters}/${canonicalOrder.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-24] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'kavi-rahasya.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-24] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'kavi-rahasya',
    title_hi: 'कवि-रहस्य',
    title_en: 'Kavi-Rahasya',
    author_hi: 'डॉ. गंगानाथ झा',
    author_en: 'Dr. Ganganath Jha',
    category_hi: 'निबंध व विमर्श',
    category_en: 'Classical Poetics, Aesthetics & Literary Theory',
    published_year: 1929,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कवि-रहस्य',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: 'महामहोपाध्याय डॉ. सर गंगानाथ झा (१८७१–१९४१) द्वारा अनूदित व व्याख्यायित आचार्य राजशेखर की काव्यमीमांसा का १७ अध्यायों का प्रामाणिक ग्रंथ।'
  });
}

// 2. Ingest Hindi Bhasha aur Uske Sahitya ka Vikas (हिंदी भाषा और उसके साहित्य का विकास - अयोध्या सिंह उपाध्याय 'हरिऔध')
async function ingestHindiBhashaVikas() {
  console.log("[BATCH-24] 2/5 Fetching हिंदी भाषा और उसके साहित्य का विकास (अयोध्या सिंह उपाध्याय 'हरिऔध')...");

  const canonicalOrder = [
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/प्रथम खंड/प्रथम प्रकरण - भाषा की परिभाषा', title: 'खंड १ (प्रकरण १): भाषा की परिभाषा' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/प्रथम खंड/दूसरा प्रकरण - हिन्दी भाषा का उद्गम', title: 'खंड १ (प्रकरण २): हिन्दी भाषा का उद्गम' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/प्रथम खंड/तीसरा प्रकरण- अन्य प्राकृत भाषाएँ और हिन्दी', title: 'खंड १ (प्रकरण ३): अन्य प्राकृत भाषाएँ और हिन्दी' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/प्रथम खंड/चौथा प्रकरण - आर्यभाषा परिवार', title: 'खंड १ (प्रकरण ४): आर्यभाषा परिवार' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/प्रथम खंड/पाँचवाँ प्रकरण - अंतरंग और बहिरंग भाषा', title: 'खंड १ (प्रकरण ५): अंतरंग और बहिरंग भाषा' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/प्रथम खंड/६ - हिन्दी भाषा की विभक्तियाँ सर्वनाम और क्रियाएँ', title: 'खंड १ (प्रकरण ६): विभक्तियाँ, सर्वनाम और क्रियाएँ' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/प्रथम खंड/सप्तम प्रकरण - हिन्दी भाषा पर अन्य भाषाओं का प्रभाव', title: 'खंड १ (प्रकरण ७): हिन्दी भाषा पर अन्य भाषाओं का प्रभाव' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/द्वितीय खंड/प्रथम प्रकरण - साहित्य', title: 'खंड २ (प्रकरण १): साहित्य का स्वरूप' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/द्वितीय खंड/२- हिन्दी साहित्य का पूर्वरूप और आरंभिक काल', title: 'खंड २ (प्रकरण २): पूर्वरूप और आरंभिक काल (भाग १)' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/द्वितीय खंड/२- हिन्दी साहित्य का पूर्वरूप और आरंभिक काल/२', title: 'खंड २ (प्रकरण २): पूर्वरूप और आरंभिक काल (भाग २)' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल', title: 'खंड २ (प्रकरण ३): माध्यमिककाल की भूमिका' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/अवधी और ब्रज', title: 'माध्यमिककाल: अवधी और ब्रजभाषा' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/गोरखनाथ', title: 'माध्यमिककाल: गोरखनाथ' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/रामानंद', title: 'माध्यमिककाल: स्वामी रामानंद' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/वल्लभाचार्य', title: 'माध्यमिककाल: महाप्रभु वल्लभाचार्य' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/कबीर', title: 'माध्यमिककाल: कबीरदास' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/नानक', title: 'माध्यमिककाल: गुरु नानकदेव' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/दादूदयाल', title: 'माध्यमिककाल: दादूदयाल' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/जायसी', title: 'माध्यमिककाल: मलिक मोहम्मद जायसी' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/सूरदास', title: 'माध्यमिककाल: महाकवि सूरदास' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/तुलसीदास', title: 'माध्यमिककाल: गोस्वामी तुलसीदास' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/मीरा', title: 'माध्यमिककाल: भक्त शिरोमणि मीराबाई' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/रहीम', title: 'माध्यमिककाल: अब्दुर्रहीम खानखाना' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/३ हिन्दी साहित्य का माध्यमिककाल/केशवदास', title: 'माध्यमिककाल: आचार्य केशवदास' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/४ उत्तर-काल', title: 'उत्तर-काल: सामान्य परिचय' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/४ उत्तर-काल/(क) निर्गुण संत कवि', title: 'उत्तर-काल: निर्गुण संत कवि' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/४ उत्तर-काल/(ख) सगुण भक्त कवि', title: 'उत्तर-काल: सगुण भक्त कवि' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/४ उत्तर-काल/(ग) रीति ग्रन्थकार', title: 'उत्तर-काल: रीति ग्रन्थकार' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/४ उत्तर-काल/आलम', title: 'उत्तर-काल: आलम' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/४ उत्तर-काल/बिहारी', title: 'उत्तर-काल: महाकवि बिहारी' },
    { page: 'हिंदी भाषा और उसके साहित्य का विकास/२/४ उत्तर-काल/भूषण', title: 'उत्तर-काल: महाकवि भूषण' }
  ];

  let mdContent = `---
id: "hindi-bhasha-aur-sahitya-ka-vikas"
title: "हिंदी भाषा और उसके साहित्य का विकास"
title_en: "Hindi Bhasha aur Uske Sahitya ka Vikas"
author: "अयोध्यासिंह उपाध्याय 'हरिऔध'"
author_en: "Ayodhya Singh Upadhyay 'Hariaudh'"
category: "भाषा व व्याकरण"
category_en: "Linguistics, Philology & Literary History"
published_year: 1930
description: "अयोध्यासिंह उपाध्याय 'हरिऔध' (१८६५–१९४७) द्वारा पटना विश्वविद्यालय में प्रदत्त ऐतिहासिक व्याख्यानों का महाग्रंथ। हिन्दी भाषा का उद्गम, प्राकृत व अपभ्रंश भाषाएँ, आर्यभाषा परिवार, व्याकरणिक रूप-विकास तथा आरम्भिक काल से लेकर माध्यमिक व उत्तर-काल के अमर कवियों (गोरखनाथ, कबीर, जायसी, सूर, तुलसी, मीरा, रहीम, केशव, बिहारी, भूषण) का ३१ अध्यायों में सांगोपांग इतिहास।"
keywords: ["hindi bhasha aur sahitya ka vikas", "hariaudh", "patna university", "hindi linguistics", "history of hindi literature", "philology"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of canonicalOrder) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch24Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-24] Ingested Hindi Bhasha chapter ${totalChapters}/${canonicalOrder.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-24] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'hindi-bhasha-aur-sahitya-ka-vikas.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-24] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'hindi-bhasha-aur-sahitya-ka-vikas',
    title_hi: 'हिंदी भाषा और उसके साहित्य का विकास',
    title_en: 'Hindi Bhasha aur Uske Sahitya ka Vikas',
    author_hi: "अयोध्यासिंह उपाध्याय 'हरिऔध'",
    author_en: "Ayodhya Singh Upadhyay 'Hariaudh'",
    category_hi: 'भाषा व व्याकरण',
    category_en: 'Linguistics, Philology & Literary History',
    published_year: 1930,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/हिंदी_भाषा_और_उसके_साहित्य_का_विकास',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: "१९३० (पटना विश्वविद्यालय) अयोध्यासिंह उपाध्याय 'हरिऔध' (१८६५–१९४७) का भाषा-विज्ञान एवं हिन्दी साहित्य के ऐतिहासिक विकास पर ३१ अध्यायों का मानक महाग्रंथ।"
  });
}

// 3. Ingest Kovid-Kirtan (कोविद-कीर्तन - आचार्य महावीर प्रसाद द्विवेदी)
async function ingestKovidKirtan() {
  console.log('[BATCH-24] 3/5 Fetching कोविद-कीर्तन (आचार्य महावीर प्रसाद द्विवेदी)...');

  const canonicalOrder = [
    { page: 'कोविद-कीर्तन/१—वामन शिवराम आपटे', title: 'वामन शिवराम आपटे' },
    { page: 'कोविद-कीर्तन/२-विष्णु शास्त्री चिपलूनकर', title: 'विष्णु शास्त्री चिपलूणकर' },
    { page: 'कोविद-कीर्तन/३-आदित्यराम भट्टाचार्य', title: 'महामहोपाध्याय आदित्यराम भट्टाचार्य' },
    { page: 'कोविद-कीर्तन/४-पण्डित मथुराप्रसाद मिश्र', title: 'पण्डित मथुराप्रसाद मिश्र' },
    { page: 'कोविद-कीर्तन/५ पण्डित कुन्दनलाल', title: 'पण्डित कुन्दनलाल' },
    { page: 'कोविद-कीर्तन/६ बौद्धाचार्य्य शीलभद्र', title: 'बौद्धाचार्य शीलभद्र' },
    { page: 'कोविद-कीर्तन/७ मौलाना मुहम्मद ज़काउल्लाह', title: 'मौलाना मुहम्मद ज़काउल्लाह' },
    { page: 'कोविद-कीर्तन/८ रावबहादुर गणेश वेङ्कटेश जोशी', title: 'रावबहादुर गणेश वेंकटेश जोशी' },
    { page: 'कोविद-कीर्तन/९ इच्छाराम सूर्य्यराम देसाई', title: 'इच्छाराम सूर्यराम देसाई' },
    { page: 'कोविद-कीर्तन/१० राय श्रीशचन्द्र बसु बहादुर', title: 'राय श्रीशचन्द्र बसु बहादुर' },
    { page: 'कोविद-कीर्तन/११ रायबहादुर पण्डित परमानन्द चतुर्वेदी', title: 'रायबहादुर पण्डित परमानन्द चतुर्वेदी' },
    { page: 'कोविद-कीर्तन/१२ सिंहल द्वीप के बौद्ध विद्वान् आचार्य सुमड़्गल', title: 'सिंहल द्वीप के बौद्ध विद्वान् आचार्य सुमंगल' }
  ];

  let mdContent = `---
id: "kovid-kirtan"
title: "कोविद-कीर्तन"
title_en: "Kovid-Kirtan"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "इतिहास व जीवन-चरित्र"
category_en: "Biographical Essays & Historical Profiles"
published_year: 1928
description: "आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा रचित मूर्धन्य भारतीय विद्वानों, भाषाविदों और विचारकों के जीवन-चरित्रों का अनुपम संकलन। वामन शिवराम आपटे, विष्णु शास्त्री चिपलूणकर, मौलाना ज़काउल्लाह, इच्छाराम देसाई, बौद्धाचार्य शीलभद्र और आचार्य सुमंगल सहित १२ अमर मनीषियों के प्रेरक व्यक्तित्व व कृतित्व का रेखांकन।"
keywords: ["kovid kirtan", "mahavir prasad dwivedi", "biography", "indian scholars", "vaman shivram apte", "chiplunkar"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of canonicalOrder) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch24Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-24] Ingested Kovid-Kirtan chapter ${totalChapters}/${canonicalOrder.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-24] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'kovid-kirtan.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-24] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'kovid-kirtan',
    title_hi: 'कोविद-कीर्तन',
    title_en: 'Kovid-Kirtan',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'इतिहास व जीवन-चरित्र',
    category_en: 'Biographical Essays & Historical Profiles',
    published_year: 1928,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/कोविद-कीर्तन',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२८ (गंगा-पुस्तकमाला, लखनऊ) आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा १२ मूर्धन्य विद्वानों पर रचित प्रामाणिक चरित-ग्रंथ।'
  });
}

// 4. Ingest Prachin Chihna (प्राचीन चिह्न - आचार्य महावीर प्रसाद द्विवेदी)
async function ingestPrachinChihna() {
  console.log('[BATCH-24] 4/5 Fetching प्राचीन चिह्न (आचार्य महावीर प्रसाद द्विवेदी)...');

  const canonicalOrder = [
    { page: 'प्राचीन चिह्न/साँची के पुराने स्तूप', title: 'साँची के पुराने स्तूप' },
    { page: 'प्राचीन चिह्न/खजुराहो', title: 'खजुराहो के प्राचीन मन्दिर' },
    { page: 'प्राचीन चिह्न/यलोरा के गुफा-मन्दिर', title: 'एलोरा के गुफा-मन्दिर' },
    { page: 'प्राचीन चिह्न/क़ुतुब-मीनार', title: 'क़ुतुब-मीनार' },
    { page: 'प्राचीन चिह्न/देवगढ़ की पुरानी इमारतें', title: 'देवगढ़ की पुरानी इमारतें' },
    { page: 'प्राचीन चिह्न/ईसापुर के यूप-स्तम्भ', title: 'ईसापुर के यूप-स्तम्भ' },
    { page: 'प्राचीन चिह्न/ओङ्कार-मान्धाता', title: 'ओंकार-मान्धाता' },
    { page: 'प्राचीन चिह्न/श्रीरङ्गजी का मन्दिर', title: 'वृन्दावन का श्रीरंगजी मन्दिर' },
    { page: 'प्राचीन चिह्न/श्रीरङ्गपत्तन', title: 'श्रीरंगपत्तन' },
    { page: 'प्राचीन चिह्न/प्रयाग-प्रान्त के प्राचीन ऐतिहासिक नगर', title: 'प्रयाग-प्रान्त के प्राचीन ऐतिहासिक नगर' },
    { page: 'प्राचीन चिह्न/पाताल-प्रविष्ट पाम्पियाई नगर', title: 'पाताल-प्रविष्ट पॉम्पेई नगर' },
    { page: 'प्राचीन चिह्न/पेरू का प्राचीन सूर्य-मन्दिर', title: 'पेरू का प्राचीन सूर्य-मन्दिर' },
    { page: 'प्राचीन चिह्न/ढाई हज़ार वर्ष की पुरानी क़बरें', title: 'ढाई हज़ार वर्ष की पुरानी क़बरें' },
    { page: 'प्राचीन चिह्न/तीस लाख वर्ष के पुराने जानवरों की ठठरियाँ', title: 'तीस लाख वर्ष के पुराने जीवाश्म व कंकाल' }
  ];

  let mdContent = `---
id: "prachin-chihna"
title: "प्राचीन चिह्न"
title_en: "Prachin Chihna"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "इतिहास व जीवन-चरित्र"
category_en: "Archaeology, Ancient Heritage & World History"
published_year: 1918
description: "आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा प्राचीन ऐतिहासिक स्मारकों, पुरातत्त्व और विश्व-धरोहरों पर विरचित ऐतिहासिक ग्रंथ। साँची के बौद्ध स्तूप, खजुराहो, एलोरा, कुतुबमीनार, देवगढ़, ईसापुर यूप-स्तम्भ, ओंकार-मान्धाता, श्रीरंगपत्तन, पॉम्पेई और पेरू के सूर्य-मन्दिर का १४ अध्यायों में सजीव पुरातात्त्विक विवरण।"
keywords: ["prachin chihna", "mahavir prasad dwivedi", "archaeology", "sanchi stupa", "ellora caves", "khajuraho", "ancient history"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of canonicalOrder) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch24Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-24] Ingested Prachin Chihna chapter ${totalChapters}/${canonicalOrder.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-24] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'prachin-chihna.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-24] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'prachin-chihna',
    title_hi: 'प्राचीन चिह्न',
    title_en: 'Prachin Chihna',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'इतिहास व जीवन-चरित्र',
    category_en: 'Archaeology, Ancient Heritage & World History',
    published_year: 1918,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/प्राचीन_चिह्न',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९१८ (इंडियन प्रेस, प्रयाग) आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा रचित पुरातत्त्व व ऐतिहासिक धरोहरों का १४ अध्यायों का शास्त्रीय संकलन।'
  });
}

// 5. Ingest Videshi Vidwan (विदेशी विद्वान् - आचार्य महावीर प्रसाद द्विवेदी)
async function ingestVideshiVidwan() {
  console.log('[BATCH-24] 5/5 Fetching विदेशी विद्वान् (आचार्य महावीर प्रसाद द्विवेदी)...');

  const canonicalOrder = [
    { page: 'विदेशी विद्वान्/१―कोपर्निकस, गैलीलियो और न्यूटन', title: 'कोपर्निकस, गैलीलियो और न्यूटन' },
    { page: 'विदेशी विद्वान्/२―हर्बर्ट स्पेन्सर', title: 'दार्शनिक हर्बर्ट स्पेंसर' },
    { page: 'विदेशी विद्वान्/३―कर्नल आलकट', title: 'कर्नल हेनरी स्टील ऑलकॉट' },
    { page: 'विदेशी विद्वान्/४―डाक्टर जी॰ थीबो, पी-एच॰ डी॰, सी॰ आई॰ ई॰', title: 'डॉ. जॉर्ज थीबो (George Thibaut)' },
    { page: 'विदेशी विद्वान्/५―मुग्धानलाचार्य्य', title: 'प्रो. मैक्स मूलर (मुग्धानलाचार्य)' },
    { page: 'विदेशी विद्वान्/६―डाक्टर कीलहार्न', title: 'डॉ. फ्रांज कीलहॉर्न (Franz Kielhorn)' },
    { page: 'विदेशी विद्वान्/७―अमेरिका के सर्वश्रेष्ठ समाचार-पत्र-सञ्चालक विलियम हार्स्ट', title: 'विलियम रैंडोल्फ हर्स्ट (William Randolph Hearst)' },
    { page: 'विदेशी विद्वान्/८―अलबरूनी', title: 'इतिहासकार व दार्शनिक अलबरूनी' },
    { page: 'विदेशी विद्वान्/९―अध्यापक एडवर्ड हेनरी पामर', title: 'प्रो. एडवर्ड हेनरी पामर' },
    { page: 'विदेशी विद्वान्/१०―बुकर टी॰ वाशिंगटन', title: 'बुकर टी. वाशिंगटन (Booker T. Washington)' },
    { page: 'विदेशी विद्वान्/११―डाक्टर हर्मन जी॰ जैकोबी', title: 'डॉ. हरमन जैकोबी (Hermann Jacobi)' }
  ];

  let mdContent = `---
id: "videshi-vidwan"
title: "विदेशी विद्वान्"
title_en: "Videshi Vidwan"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "इतिहास व जीवन-चरित्र"
category_en: "Global Biography, Philosophy & Science"
published_year: 1921
description: "आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा विश्व-प्रसिद्ध वैज्ञानिकों, दार्शनिकों, समाज-सुधारकों और प्राच्यविद्या-विशारदों के जीवन और योगदान पर रचित ग्रंथ। कोपर्निकस, गैलीलियो, न्यूटन, हर्बर्ट स्पेंसर, कर्नल ऑलकॉट, मैक्स मूलर, कीलहॉर्न, अलबरूनी, बुकर टी. वाशिंगटन और हरमन जैकोबी सहित ११ महापुरुषों के प्रेरणादायी चरित्र।"
keywords: ["videshi vidwan", "mahavir prasad dwivedi", "biography", "copernicus", "galileo", "newton", "max muller", "alberuni"]
cover: ""
---

`;

  let totalChapters = 0;
  for (const item of canonicalOrder) {
    try {
      const raw = await fetchWikiPage(item.page);
      const clean = cleanBatch24Text(cleanWikiHtml(raw));
      if (clean.length > 30) {
        totalChapters++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-24] Ingested Videshi Vidwan chapter ${totalChapters}/${canonicalOrder.length}: ${item.title} (${clean.length} chars)`);
      }
      await sleep(120);
    } catch (e) {
      console.warn(`[BATCH-24] Error fetching ${item.page}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, 'videshi-vidwan.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-24] Saved ${filePath} with ${totalChapters} chapters.`);

  logSourceRecord({
    id: 'videshi-vidwan',
    title_hi: 'विदेशी विद्वान्',
    title_en: 'Videshi Vidwan',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'इतिहास व जीवन-चरित्र',
    category_en: 'Global Biography, Philosophy & Science',
    published_year: 1921,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/विदेशी_विद्वान्',
    ingested_at: '2026-11-14',
    chapter_count: totalChapters,
    verification_notes: '१९२१ (इंडियन प्रेस, प्रयाग) आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा ११ अंतरराष्ट्रीय विद्वानों, वैज्ञानिकों व विचारकों पर रचित प्रामाणिक चरित-ग्रंथ।'
  });
}

async function runBatch24() {
  console.log('=== STARTING BATCH 24 INGESTION ===');
  await ingestKaviRahasya();
  await ingestHindiBhashaVikas();
  await ingestKovidKirtan();
  await ingestPrachinChihna();
  await ingestVideshiVidwan();
  console.log('=== COMPLETED BATCH 24 INGESTION ===');
}

runBatch24().catch(console.error);
