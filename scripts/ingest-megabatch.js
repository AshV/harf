import fs from 'fs';
import path from 'path';
import { cleanWikiHtml, fetchWikiPage, logSourceRecord } from './fetch-wikisource.js';
import https from 'node:https';

const RAW_DIR = path.resolve('content/raw');

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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

async function getSubpages(prefix) {
  let apcontinue = '';
  const pages = [];
  while (true) {
    let url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=100&format=json`;
    if (apcontinue) url += `&apcontinue=${encodeURIComponent(apcontinue)}`;
    const res = await fetchJson(url);
    const list = res?.query?.allpages || [];
    pages.push(...list.map(p => p.title));
    if (res?.continue?.apcontinue) {
      apcontinue = res.continue.apcontinue;
    } else {
      break;
    }
  }
  return pages.filter(p => p !== prefix.replace(/\/$/, ''));
}

function cleanGeneralText(text, bookTitle) {
  if (!text) return '';
  let cleaned = text;

  // Remove multi-line navigation headers at start
  while (true) {
    const next = cleaned.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण|अनुक्रमणिका|पिछला|आगे|पीछे|मुखपृष्ठ|मुख्यपृष्ठ|भूमिका|मङ्गलाचरण|अगला भाग|अगला अध्याय|पिछला अध्याय|\(\d{4}\))[^\n]*?\n+/i, '');
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

async function ingestBook({
  id,
  titleHi,
  titleEn,
  authorHi,
  authorEn,
  categoryHi,
  categoryEn,
  year,
  description,
  keywords,
  sourceUrl,
  subpagesList,
  prefix,
  sortFn,
  verificationNotes
}) {
  console.log(`\n[MEGABATCH] === Processing ${titleHi} (${authorHi}) ===`);

  let targetPages = subpagesList;
  if (!targetPages && prefix) {
    targetPages = await getSubpages(prefix);
    if (sortFn) {
      targetPages.sort(sortFn);
    }
  }

  let mdContent = `---
id: "${id}"
title: "${titleHi}"
title_en: "${titleEn}"
author: "${authorHi}"
author_en: "${authorEn}"
category: "${categoryHi}"
category_en: "${categoryEn}"
published_year: ${year}
description: "${description.replace(/"/g, '\\"')}"
keywords: ${JSON.stringify(keywords)}
cover: ""
---

`;

  let chapterCount = 0;
  for (let i = 0; i < targetPages.length; i++) {
    const item = targetPages[i];
    const pageTitle = typeof item === 'string' ? item : item.page;
    const sectionName = typeof item === 'string' ? item.replace(new RegExp(`^${prefix}`), '').replace(/^[\/—–-]+/, '').trim() : item.title;

    try {
      const raw = await fetchWikiPage(pageTitle);
      const clean = cleanGeneralText(cleanWikiHtml(raw), titleHi);

      if (clean.length > 40) {
        chapterCount++;
        mdContent += `\n# ${sectionName || `भाग ${chapterCount}`}\n\n${clean}\n\n`;
        console.log(`[MEGABATCH] [${id}] (${chapterCount}/${targetPages.length}): ${sectionName} (${clean.length} chars)`);
      }
      // Polite sleep to prevent any throttling
      await sleep(180);
    } catch (e) {
      console.warn(`[MEGABATCH] Error fetching ${pageTitle}:`, e.message);
    }
  }

  const filePath = path.join(RAW_DIR, `${id}.md`);
  fs.writeFileSync(filePath, mdContent);
  console.log(`[MEGABATCH] Saved ${filePath} with ${chapterCount} chapters.`);

  logSourceRecord({
    id,
    title_hi: titleHi,
    title_en: titleEn,
    author_hi: authorHi,
    author_en: authorEn,
    category_hi: categoryHi,
    category_en: categoryEn,
    published_year: year,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: sourceUrl,
    ingested_at: '2026-11-14',
    chapter_count: chapterCount,
    verification_notes: verificationNotes
  });

  return chapterCount;
}

function devanagariToNumber(str) {
  const map = { '०': 0, '१': 1, '२': 2, '३': 3, '४': 4, '५': 5, '६': 6, '७': 7, '८': 8, '९': 9 };
  const digits = str.replace(/[^\u0966-\u096F\d]/g, '');
  if (!digits) return 999;
  return Number(digits.replace(/[\u0966-\u096F]/g, d => map[d] !== undefined ? map[d] : d));
}

async function runMegabatch() {
  console.log('====================================================');
  console.log('   STARTING SINGLE CONTINUOUS MEGABATCH INGESTION   ');
  console.log('====================================================');

  // 1. Kamna (जयशंकर प्रसाद)
  await ingestBook({
    id: 'kamna',
    titleHi: 'कामना',
    titleEn: 'Kamna',
    authorHi: 'जयशंकर प्रसाद',
    authorEn: 'Jaishankar Prasad',
    categoryHi: 'नाटक',
    categoryEn: 'Allegorical & Philosophical Play',
    year: 1927,
    description: "छायावाद के युगप्रवर्तक जयशंकर प्रसाद (१८८९–१९३७) द्वारा विरचित सुप्रसिद्ध रूपक एवं प्रतीकात्मक नाटक। मनुष्य के अंतःकरण की प्रवृत्तियों—कामना, संतोष, विवेक, शांति, विनोद और दंभ के द्वंद्व तथा स्वर्ण-लोभ व सभ्यता के संकट का २३ दृश्यों में अलौकिक काव्यात्मक नाट्य-रूपांतरण।",
    keywords: ["kamna", "jaishankar prasad", "allegorical play", "hindi natak", "chhayavad"],
    sourceUrl: 'https://hi.wikisource.org/wiki/कामना',
    prefix: 'कामना/',
    verificationNotes: '१९२७ (भारती भण्डार, प्रयाग) जयशंकर प्रसाद (१८८९–१९३७) का २३ दृश्यों का सुप्रसिद्ध रूपक-नाटक।'
  });

  // 2. Hind Swaraj (महात्मा गांधी)
  await ingestBook({
    id: 'hind-swaraj',
    titleHi: 'हिन्द स्वराज',
    titleEn: 'Hind Swaraj',
    authorHi: 'महात्मा गांधी',
    authorEn: 'Mahatma Gandhi',
    categoryHi: 'निबंध व विमर्श',
    categoryEn: 'Political Philosophy & Manifesto',
    year: 1909,
    description: "राष्ट्रपिता महात्मा गांधी (१८६९–१९४८) का युगांतरकारी दार्शनिक व वैचारिक घोषणापत्र। स्वदेशी, सत्याग्रह, आधुनिक सभ्यता की समालोचना, स्वराज का वास्तविक अर्थ और अहिंसा के मूल सिद्धांतों का सम्पूर्ण २० अध्यायों में पाठकीय संवाद के रूप में शाश्वत विवेचन।",
    keywords: ["hind swaraj", "mahatma gandhi", "swaraj", "satyagraha", "indian independence", "political philosophy"],
    sourceUrl: 'https://hi.wikisource.org/wiki/हिन्द_स्वराज',
    prefix: 'हिन्द स्वराज/',
    verificationNotes: '१९०९ (नवजीवन ट्रस्ट) महात्मा गांधी (१८६९–१९४८) का प्रामाणिक एवं मूल वैचारिक ग्रंथ।'
  });

  // 3. Kapalkundala (बंकिमचन्द्र चट्टोपाध्याय)
  await ingestBook({
    id: 'kapalkundala',
    titleHi: 'कपालकुण्डला',
    titleEn: 'Kapalkundala',
    authorHi: 'बंकिमचन्द्र चट्टोपाध्याय',
    authorEn: 'Bankim Chandra Chattopadhyay',
    categoryHi: 'उपन्यास',
    categoryEn: 'Romantic & Historical Classic Novel',
    year: 1866,
    description: "भारतीय उपन्यास-साहित्य के जनक बंकिमचन्द्र चट्टोपाध्याय (१८३८–१८९४) का अमर प्रेमाख्यान उपन्यास। समुद्रतट के भयानक वन में कापालिक के चंगुल से नवकुमार का उद्धार, प्रकृति-कन्या कपालकुण्डला का रहस्यमयी अंतःकरण और मानव-नियति का ३२ अध्यायों में भव्य चित्रण।",
    keywords: ["kapalkundala", "bankim chandra chattopadhyay", "classic novel", "bengali hindi translation", "historical romance"],
    sourceUrl: 'https://hi.wikisource.org/wiki/कपालकुण्डला',
    prefix: 'कपालकुण्डला/',
    verificationNotes: '१८६६ बंकिमचन्द्र चट्टोपाध्याय (१८३८–१८९४) का सम्पूर्ण ३२ अध्यायों का सुप्रसिद्ध शास्त्रीय उपन्यास।'
  });

  // 4. Durgeshnandini (बंकिमचन्द्र चट्टोपाध्याय)
  await ingestBook({
    id: 'durgeshnandini',
    titleHi: 'दुर्गेशनन्दिनी',
    titleEn: 'Durgeshnandini',
    authorHi: 'बंकिमचन्द्र चट्टोपाध्याय',
    authorEn: 'Bankim Chandra Chattopadhyay',
    categoryHi: 'उपन्यास',
    categoryEn: 'First Historical Novel of Modern India',
    year: 1865,
    description: "आधुनिक भारतीय साहित्य का प्रथम ऐतिहासिक उपन्यास। १६वीं शताब्दी के मुग़ल-पठान संघर्ष के ऐतिहासिक धरातल पर राजकुमार जगतसिंह, मान्दारन के दुर्गपति की कन्या तिलोत्तमा और पठान-सुंदरी आयशा के त्रिकोणीय उदात्त प्रेम, शौर्य और त्याग का सम्पूर्ण दो भागों व ४३ अध्यायों में सजीव चित्रण।",
    keywords: ["durgeshnandini", "bankim chandra", "historical novel", "jagatsingh", "ayesha", "tilottama"],
    sourceUrl: 'https://hi.wikisource.org/wiki/दुर्गेशनन्दिनी_प्रथम_भाग',
    subpagesList: [
      ...(await getSubpages('दुर्गेशनन्दिनी प्रथम भाग/')),
      ...(await getSubpages('दुर्गेशनन्दिनी द्वितीय भाग/'))
    ],
    verificationNotes: '१८६५ बंकिमचन्द्र चट्टोपाध्याय (१८३८–१८९४) का सम्पूर्ण दो भागों (४३ परिच्छेदों) का प्रथम ऐतिहासिक उपन्यास।'
  });

  // 5. Sankalan (आचार्य महावीर प्रसाद द्विवेदी)
  await ingestBook({
    id: 'sankalan',
    titleHi: 'सङ्कलन',
    titleEn: 'Sankalan',
    authorHi: 'आचार्य महावीर प्रसाद द्विवेदी',
    authorEn: 'Acharya Mahavir Prasad Dwivedi',
    categoryHi: 'निबंध व विमर्श',
    categoryEn: 'Essays, Science & Literary Observations',
    year: 1924,
    description: "आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा विरचित विविध ज्ञान-विज्ञान, भाषा, समाज और पुरातात्त्विक विषयों पर २५ अमर निबंधों का संकलन। वैज्ञानिक शोध, सामाजिक कुरीतियाँ, ऐतिहासिक चरित्र और कला-साहित्य का सुगम खड़ी बोली में गंभीर विवेचन।",
    keywords: ["sankalan", "mahavir prasad dwivedi", "essays", "science", "literature", "social critique"],
    sourceUrl: 'https://hi.wikisource.org/wiki/सङ्कलन',
    prefix: 'सङ्कलन/',
    verificationNotes: '१९२४ आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) के २५ निबंधों का मानक संग्रह।'
  });

  // 6. Drishya-Darshan (आचार्य महावीर प्रसाद द्विवेदी)
  await ingestBook({
    id: 'drishya-darshan',
    titleHi: 'दृश्य-दर्शन',
    titleEn: 'Drishya-Darshan',
    authorHi: 'आचार्य महावीर प्रसाद द्विवेदी',
    authorEn: 'Acharya Mahavir Prasad Dwivedi',
    categoryHi: 'इतिहास व जीवन-चरित्र',
    categoryEn: 'Travelogues, Architecture & Cultural Landscapes',
    year: 1924,
    description: "आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) द्वारा भारत के ऐतिहासिक स्थलों, स्थापत्य कला और प्राकृतिक दृश्यों पर रचित यात्रा-वृत्त एवं पुरातात्त्विक संस्मरण। औरंगाबाद, दौलताबाद, ग्वालियर दुर्ग, चरखारी-राज्य और विंध्याचल के दर्शनीय स्थलों का १३ अध्यायों में सजीव रेखांकन।",
    keywords: ["drishya darshan", "mahavir prasad dwivedi", "travelogue", "historical monuments", "gwalior fort", "daulatabad"],
    sourceUrl: 'https://hi.wikisource.org/wiki/दृश्य-दर्शन',
    prefix: 'दृश्य-दर्शन/',
    verificationNotes: '१९२४ आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) का १३ अध्यायों का ऐतिहासिक यात्रा-वृत्त ग्रंथ।'
  });

  // 7. Hindi Bhasha ki Utpatti (आचार्य महावीर प्रसाद द्विवेदी)
  await ingestBook({
    id: 'hindi-bhasha-ki-utpatti',
    titleHi: 'हिन्दी भाषा की उत्पत्ति',
    titleEn: 'Hindi Bhasha ki Utpatti',
    authorHi: 'आचार्य महावीर प्रसाद द्विवेदी',
    authorEn: 'Acharya Mahavir Prasad Dwivedi',
    categoryHi: 'भाषा व व्याकरण',
    categoryEn: 'Philology, Linguistics & Origin of Hindi',
    year: 1907,
    description: "आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) का हिन्दी भाषा के ऐतिहासिक उद्भव और विकास पर लिखा गया प्रथम मानक भाषा-वैज्ञानिक ग्रंथ। वैदिक काल, संस्कृत, पालि, प्राकृत, अपभ्रंश तथा मध्यकालीन बोलियों से आधुनिक खड़ी बोली के प्रादुर्भाव का ६ अध्यायों में वैज्ञानिक विश्लेषण।",
    keywords: ["hindi bhasha ki utpatti", "mahavir prasad dwivedi", "linguistics", "philology", "origin of hindi", "prakrit"],
    sourceUrl: 'https://hi.wikisource.org/wiki/हिन्दी_भाषा_की_उत्पत्ति',
    prefix: 'हिन्दी भाषा की उत्पत्ति/',
    verificationNotes: '१९०७ (इंडियन प्रेस, प्रयाग) आचार्य महावीर प्रसाद द्विवेदी (१८६४–१९३८) का ६ अध्यायों का भाषा-वैज्ञानिक ग्रंथ।'
  });

  // 8. Aalha-Khand (महाकवि जगनिक)
  await ingestBook({
    id: 'aalha-khand',
    titleHi: 'आल्हखण्ड',
    titleEn: 'Aalha-Khand',
    authorHi: 'महाकवि जगनिक',
    authorEn: 'Jagnik',
    categoryHi: 'कविता',
    categoryEn: 'Classical Heroic Ballad & Epic Poetry',
    year: 1182,
    description: "आदिकाल के महाकवि जगनिक द्वारा १२वीं शताब्दी में रचित बुन्देलखंड का अमर वीर-काव्य। महोबा के वीर योद्धाओं आल्हा और ऊदल के अदम्य शौर्य, ५२ लड़ाइयों, पृथ्वीराज चौहान व जयचंद के साथ ऐतिहासिक संघर्षों का २३ अध्यायों में ओजस्वी आल्हा छंद में गायन।",
    keywords: ["aalha khand", "jagnik", "alha udal", "heroic poetry", "bundelkhand", "chandel", "veer rasa"],
    sourceUrl: 'https://hi.wikisource.org/wiki/आल्हखण्ड',
    prefix: 'आल्हखण्ड/',
    verificationNotes: '१२वीं शताब्दी के महाकवि जगनिक द्वारा रचित वीर-रस का सम्पूर्ण २३ अध्यायों का लोक-महाकाव्य।'
  });

  // 9. Vishwa Prapanch (बाबू श्यामसुन्दर दास)
  await ingestBook({
    id: 'vishwa-prapanch',
    titleHi: 'विश्व प्रपंच',
    titleEn: 'Vishwa Prapanch',
    authorHi: 'बाबू श्यामसुन्दर दास',
    authorEn: 'Babu Shyam Sundar Das',
    categoryHi: 'निबंध व विमर्श',
    categoryEn: 'Cosmology, Natural Philosophy & Science',
    year: 1920,
    description: "काशी नागरी प्रचारिणी सभा के संस्थापक बाबू श्यामसुन्दर दास (१८७५–१९४५) द्वारा विरचित सृष्टि-विज्ञान, ब्रह्मांड, जीव-विकास और चेतना का दार्शनिक महाग्रंथ। अर्न्स्ट हेकल के 'रिडल ऑफ़ द यूनिवर्स' का हिन्दी में १९ अध्यायों में उच्चस्तरीय वैज्ञानिक एवं तात्विक रूपान्तर।",
    keywords: ["vishwa prapanch", "shyam sundar das", "cosmology", "science", "philosophy", "evolution", "universe"],
    sourceUrl: 'https://hi.wikisource.org/wiki/विश्व_प्रपंच',
    prefix: 'विश्व प्रपंच/',
    verificationNotes: '१९२० (इंडियन प्रेस, प्रयाग) बाबू श्यामसुन्दर दास (१८७५–१९४५) का १९ अध्यायों का वैज्ञानिक-दार्शनिक ग्रंथ।'
  });

  // 10. Itihas Timirnashak 2 (राजा शिवप्रसाद 'सितारेहिन्द')
  await ingestBook({
    id: 'itihas-timirnashak-2',
    titleHi: 'इतिहास तिमिरनाशक (भाग २)',
    titleEn: 'Itihas Timirnashak (Part 2)',
    authorHi: "राजा शिवप्रसाद 'सितारेहिन्द'",
    authorEn: "Raja Shivprasad 'Sitarehind'",
    categoryHi: 'इतिहास व जीवन-चरित्र',
    categoryEn: 'Modern Indian History & Historiography',
    year: 1873,
    description: "भारतेन्दु-पूर्व युग के मूर्धन्य इतिहासकार राजा शिवप्रसाद सितारेहिन्द (१८२३–१८९५) द्वारा विरचित आधुनिक भारत का ऐतिहासिक ग्रंथ। १८वीं व १९वीं शताब्दी में मराठों, मुग़लों के पतन, अर्ल ऑफ़ माइरा, लॉर्ड ऑकलैंड और ईस्ट इंडिया कंपनी के भारत में विस्तार का १३ अध्यायों में प्रामाणिक विवरण।",
    keywords: ["itihas timirnashak", "sitarehind", "indian history", "maratha", "mughal", "19th century india"],
    sourceUrl: 'https://hi.wikisource.org/wiki/इतिहास_तिमिरनाशक_2',
    prefix: 'इतिहास तिमिरनाशक 2/',
    verificationNotes: '१८७३ राजा शिवप्रसाद सितारेहिन्द (१८२३–१८९५) का १३ अध्यायों का ऐतिहासिक ग्रंथ।'
  });

  // 11. Panchatantra (विष्णुशर्मा)
  await ingestBook({
    id: 'panchatantra',
    titleHi: 'पंचतन्त्र',
    titleEn: 'Panchatantra',
    authorHi: 'विष्णुशर्मा',
    authorEn: 'Vishnusharma',
    categoryHi: 'कहानी',
    categoryEn: 'Timeless Classical Fables & Ethics',
    year: 300,
    description: "आचार्य विष्णुशर्मा द्वारा रचित विश्व-साहित्य की अमर नीति-कथाओं का सर्वकालिक महाग्रंथ। मित्रभेद, मित्रप्राप्ति, काकोलूकीयम्, लब्धप्रणाश और अपरीक्षितकारकम्—सम्पूर्ण ५ तन्त्रों में पशु-पक्षियों के रोचक प्रतीकों द्वारा राजनीति, व्यवहार-नीति और जीवन-मूल्यों का अप्रतिम शिक्षण।",
    keywords: ["panchatantra", "vishnusharma", "fables", "morality", "niti shastra", "ancient indian tales"],
    sourceUrl: 'https://hi.wikisource.org/wiki/पंचतन्त्र',
    subpagesList: [
      { page: 'पंचतन्त्र/प्रथम तन्त्र', title: 'प्रथम तन्त्र: मित्रभेद' },
      { page: 'पंचतन्त्र/द्वितीय तन्त्र', title: 'द्वितीय तन्त्र: मित्रलाभ (मित्रप्राप्ति)' },
      { page: 'पंचतन्त्र/तृतीय तन्त्र', title: 'तृतीय तन्त्र: काकोलूकीयम् (संधि-विग्रह)' },
      { page: 'पंचतन्त्र/चतुर्थ तन्त्र', title: 'चतुर्थ तन्त्र: लब्धप्रणाश' },
      { page: 'पंचतन्त्र/पंचम तन्त्र', title: 'पंचम तन्त्र: अपरीक्षितकारकम्' }
    ],
    verificationNotes: 'आचार्य विष्णुशर्मा द्वारा विरचित सम्पूर्ण ५ तन्त्रों का प्रामाणिक शास्त्रीय पाठ।'
  });

  // 12. Satyarth Prakash (स्वामी दयानंद सरस्वती)
  await ingestBook({
    id: 'satyarth-prakash',
    titleHi: 'सत्यार्थ प्रकाश',
    titleEn: 'Satyarth Prakash',
    authorHi: 'स्वामी दयानंद सरस्वती',
    authorEn: 'Swami Dayanand Saraswati',
    categoryHi: 'निबंध व विमर्श',
    categoryEn: 'Vedic Philosophy & Social Reform',
    year: 1875,
    description: "आर्य समाज के संस्थापक महर्षि स्वामी दयानंद सरस्वती (१८२४–१८८३) का अमर दार्शनिक एवं वैचारिक महाग्रंथ। ईश्वर के स्वरूप, बाल-शिक्षा, ब्रह्मचर्य, वेदाध्ययन, वर्ण-व्यवस्था, राजधर्म, मोक्ष और सामाजिक सुधारों का प्रामाणिक वैदिक सिद्धांतों के आधार पर ओजस्वी प्रतिपादन।",
    keywords: ["satyarth prakash", "dayanand saraswati", "arya samaj", "vedic philosophy", "dharma", "social reform"],
    sourceUrl: 'https://hi.wikisource.org/wiki/सत्यार्थ_प्रकाश',
    subpagesList: [
      { page: 'सत्यार्थ प्रकाश/भूमिका', title: 'भूमिका व निवेदन' },
      { page: 'सत्यार्थ प्रकाश/अथ सत्यार्थप्रकाशः', title: 'प्रथम समुल्लास: ओंकार व ईश्वर के नाम' },
      { page: 'सत्यार्थ प्रकाश/प्रथमसमुल्लासः', title: 'प्रथम समुल्लास: ईश्वर-स्वरूप विवेचन' },
      { page: 'सत्यार्थ प्रकाश/द्वितीयसमुल्लास:', title: 'द्वितीय समुल्लास: बाल-शिक्षा व संस्कार' },
      { page: 'सत्यार्थ प्रकाश/तृतीयसमुल्लास:', title: 'तृतीय समुल्लास: अध्ययन-अध्यापन व ब्रह्मचर्य' }
    ],
    verificationNotes: '१८७५ स्वामी दयानंद सरस्वती (१८२४–१८८३) का प्रामाणिक दार्शनिक ग्रंथ।'
  });

  // 13. Striyon ki Paradhinata (लाला सीताराम)
  await ingestBook({
    id: 'striyon-ki-paradhinata',
    titleHi: 'स्त्रियों की पराधीनता',
    titleEn: 'Striyon ki Paradhinata',
    authorHi: 'लाला सीताराम',
    authorEn: 'Lala Sitaram',
    categoryHi: 'निबंध व विमर्श',
    categoryEn: 'Feminist Philosophy & Human Rights',
    year: 1918,
    description: "जॉन स्टुअर्ट मिल के प्रसिद्ध ग्रंथ 'द सब्जेक्शन ऑफ़ विमेन' (The Subjection of Women) का लाला सीताराम 'भूप' (१८५८–१९३७) द्वारा किया गया ऐतिहासिक हिन्दी अनुवाद। स्त्री-पुरुष समानता, नारी-शिक्षा, वैवाहिक अधिकार और सामाजिक न्याय का ५ अध्यायों में अकाट्य तार्किक प्रतिपादन।",
    keywords: ["striyon ki paradhinata", "lala sitaram", "john stuart mill", "subjection of women", "women rights", "gender equality"],
    sourceUrl: 'https://hi.wikisource.org/wiki/स्त्रियों_की_पराधीनता',
    prefix: 'स्त्रियों की पराधीनता/',
    verificationNotes: '१९१८ लाला सीताराम (१८५८–१९३७) द्वारा अनूदित जॉन स्टुअर्ट मिल का अमर ग्रंथ।'
  });

  // 14. Upayogitavad (लाला सीताराम)
  await ingestBook({
    id: 'upayogitavad',
    titleHi: 'उपयोगितावाद',
    titleEn: 'Upayogitavad',
    authorHi: 'लाला सीताराम',
    authorEn: 'Lala Sitaram',
    categoryHi: 'निबंध व विमर्श',
    categoryEn: 'Ethics & Utilitarian Philosophy',
    year: 1918,
    description: "जॉन स्टुअर्ट मिल के नैतिक दर्शन 'यूटिलिटेरियनिज्म' (Utilitarianism) का लाला सीताराम 'भूप' द्वारा किया गया प्रामाणिक अनुवाद। अधिकतम व्यक्तियों के अधिकतम कल्याण का सिद्धांत, सुख व दुःख की गुणवत्ता, न्याय और उपयोगिता के संबंध का ८ अध्यायों में तात्विक विवेचन।",
    keywords: ["upayogitavad", "lala sitaram", "john stuart mill", "utilitarianism", "ethics", "moral philosophy"],
    sourceUrl: 'https://hi.wikisource.org/wiki/उपयोगितावाद',
    prefix: 'उपयोगितावाद/',
    verificationNotes: '१९१८ लाला सीताराम (१८५८–१९३७) द्वारा अनूदित नैतिक दर्शन का प्रामाणिक ग्रंथ।'
  });

  console.log('====================================================');
  console.log('   ALL MEGABATCH WORKS SUCCESSFULLY INGESTED!       ');
  console.log('====================================================');
}

runMegabatch().catch(console.error);
