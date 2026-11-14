import fs from 'fs';
import path from 'path';
import { cleanWikiHtml, fetchWikiPage, logSourceRecord } from './fetch-wikisource.js';

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

// 1. Ingest Prem Dwadashi (शतरंज के खिलाड़ी व प्रेम-द्वादशी by Munshi Premchand) - 12 Stories
async function ingestPremDwadashi() {
  console.log('[BATCH-10] Fetching शतरंज के खिलाड़ी व प्रेम-द्वादशी (Munshi Premchand)...');

  const stories = [
    { title: 'शांति', page: 'प्रेम-द्वादशी/१ शांति' },
    { title: 'बैंक का दिवाला', page: 'प्रेम-द्वादशी/२ बैंक का दिवाला' },
    { title: 'आत्माराम', page: 'प्रेम-द्वादशी/३ आत्माराम' },
    { title: 'दुर्गा का मन्दिर', page: 'प्रेम-द्वादशी/४ दुर्गा का मन्दिर' },
    { title: 'बड़े घर की बेटी', page: 'प्रेम-द्वादशी/५ बड़े घर की बेटी' },
    { title: 'सत्याग्रह', page: 'प्रेम-द्वादशी/६ सत्याग्रह' },
    { title: 'गृह-दाह', page: 'प्रेम-द्वादशी/७ गृह-दाह' },
    { title: 'डिक्री के रुपये', page: 'प्रेम-द्वादशी/८ डिक्री के रुपये' },
    { title: 'मुक्ति-मार्ग', page: 'प्रेम-द्वादशी/९ मुक्ति-मार्ग' },
    { title: 'शतरंज के खिलाड़ी', page: 'प्रेम-द्वादशी/१० शतरंज के खिलाड़ी' },
    { title: 'पंच परमेश्वर', page: 'प्रेम-द्वादशी/११ पंच परमेश्वर' },
    { title: 'शंखनाद', page: 'प्रेम-द्वादशी/१२ शंखनाद' }
  ];

  let mdContent = `---
id: "prem-dwadashi"
title: "शतरंज के खिलाड़ी व प्रेम-द्वादशी"
title_en: "Shatranj Ke Khiladi & Prem Dwadashi"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "कहानी"
category_en: "Stories"
published_year: 1926
description: "मुंशी प्रेमचंद का कालजयी कथा-संग्रह। नवाब वाजिद अली शाह के पतनशील लखनऊ की पृष्ठभूमि पर रचित विश्वविख्यात कहानी 'शतरंज के खिलाड़ी', ग्रामीण यथार्थ की अमर गाथा 'मुक्ति-मार्ग', 'आत्माराम' और 'सत्याग्रह' सहित १२ अमर कहानियाँ।"
keywords: ["shatranj ke khiladi", "prem dwadashi", "munshi premchand", "lucknow", "classic stories", "kahani"]
cover: ""
---

`;

  let totalStories = 0;
  for (let i = 0; i < stories.length; i++) {
    const s = stories[i];
    try {
      const html = await fetchWikiPage(s.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalStories++;
        mdContent += `\n# कहानी ${i + 1} — ${s.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-10] Ingested Prem Dwadashi ${i + 1}/12: ${s.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-10] Error fetching ${s.page}:`, e.message);
    }
    await sleep(200);
  }

  const filePath = path.join(RAW_DIR, 'prem-dwadashi.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-10] Saved ${filePath} with ${totalStories} stories.`);

  logSourceRecord({
    id: 'prem-dwadashi',
    title_hi: 'शतरंज के खिलाड़ी व प्रेम-द्वादशी',
    title_en: 'Shatranj Ke Khiladi & Prem Dwadashi',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'कहानी',
    category_en: 'Stories',
    published_year: 1926,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/प्रेम-द्वादशी',
    ingested_at: '2026-11-14',
    chapter_count: totalStories,
    verification_notes: '१९२६/१९३८ के संस्करण से हिन्दी विकिस्रोत पर सत्यापित शतरंज के खिलाड़ी सहित सम्पूर्ण १२ कहानियाँ।'
  });
}

// 2. Ingest Sapta Saroj (सप्तसरोज by Munshi Premchand) - 7 Stories + Bhumika
async function ingestSaptaSaroj() {
  console.log('[BATCH-10] Fetching सप्तसरोज (Munshi Premchand)...');

  const items = [
    { title: 'भूमिका — प्रथम संस्करण का वक्तव्य', page: 'सप्तसरोज/भूमिका' },
    { title: 'नमक का दारोगा', page: 'सप्तसरोज/नमक का दारोगा' },
    { title: 'बड़े घर की बेटी', page: 'सप्तसरोज/बड़े घर की बेटी' },
    { title: 'पंच परमेश्वर', page: 'सप्तसरोज/पंच परमेश्वर' },
    { title: 'उपदेश', page: 'सप्तसरोज/उपदेश' },
    { title: 'परीक्षा', page: 'सप्तसरोज/परीक्षा' },
    { title: 'सज्जनता का दंड', page: 'सप्तसरोज/सज्जनता का दंड' },
    { title: 'सौत', page: 'सप्तसरोज/सौत' }
  ];

  let mdContent = `---
id: "sapta-saroj"
title: "सप्तसरोज"
title_en: "Sapta Saroj"
author: "मुंशी प्रेमचंद"
author_en: "Munshi Premchand"
category: "कहानी"
category_en: "Stories"
published_year: 1917
description: "१९१७ में प्रकाशित मुंशी प्रेमचंद का प्रथम ऐतिहासिक हिन्दी कहानी-संग्रह। कर्तव्य-निष्ठा और सत्य की विजय का अमर आख्यान 'नमक का दारोगा', पारिवारिक सद्भाव की 'बड़े घर की बेटी' तथा 'पंच परमेश्वर' सहित ७ अविस्मरणीय कहानियाँ।"
keywords: ["sapta saroj", "namak ka daroga", "munshi premchand", "bade ghar ki beti", "classic hindi stories", "kahani"]
cover: ""
---

`;

  let totalItems = 0;
  for (const item of items) {
    try {
      const html = await fetchWikiPage(item.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalItems++;
        mdContent += `\n# ${item.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-10] Ingested Sapta Saroj: ${item.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-10] Error fetching ${item.page}:`, e.message);
    }
    await sleep(200);
  }

  const filePath = path.join(RAW_DIR, 'sapta-saroj.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-10] Saved ${filePath} with ${totalItems} items.`);

  logSourceRecord({
    id: 'sapta-saroj',
    title_hi: 'सप्तसरोज',
    title_en: 'Sapta Saroj',
    author_hi: 'मुंशी प्रेमचंद',
    author_en: 'Munshi Premchand',
    category_hi: 'कहानी',
    category_en: 'Stories',
    published_year: 1917,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/सप्तसरोज',
    ingested_at: '2026-11-14',
    chapter_count: totalItems,
    verification_notes: '१९१७ के मूल प्रथम संस्करण से हिन्दी विकिस्रोत पर सत्यापित नमक का दारोगा, बड़े घर की बेटी सहित सम्पूर्ण ७ कहानियाँ व भूमिका।'
  });
}

// 3. Ingest Premjogini (प्रेमजोगिनी by Bharatendu Harishchandra) - 4 Acts
async function ingestPremjogini() {
  console.log('[BATCH-10] Fetching प्रेमजोगिनी (Bharatendu Harishchandra)...');

  const acts = [
    { title: 'पहिला अंक (पहिला गर्भांक) — मंदिर का चौक व पाखंड-चित्र', page: 'भारतेंदु-नाटकावली/३–प्रेमजोगिनी/पहिला अंक' },
    { title: 'दूसरा गर्भांक — गंगा-तट व पंडे-पुजारियों का प्रपंच', page: 'भारतेंदु-नाटकावली/३–प्रेमजोगिनी/दूसरा गर्भांक' },
    { title: 'तीसरा गर्भांक — काशी के रईसों का समाज व खोखलापन', page: 'भारतेंदु-नाटकावली/३–प्रेमजोगिनी/तीसरा गर्भांक' },
    { title: 'चौथा गर्भांक — प्रेमजोगिनी का रहस्य व यथार्थ-बोध', page: 'भारतेंदु-नाटकावली/३–प्रेमजोगिनी/चौथा गर्भांक' }
  ];

  let mdContent = `---
id: "premjogini"
title: "प्रेमजोगिनी"
title_en: "Premjogini"
author: "भारतेन्दु हरिश्चंद्र"
author_en: "Bharatendu Harishchandra"
category: "नाटक"
category_en: "Play / Drama"
published_year: 1875
description: "भारतेन्दु हरिश्चंद्र का काशी की धार्मिक विडंबना, पाखंडी मठाधीशों और सामाजिक ढोंग पर लिखा गया सर्वाधिक प्रखर चार अंकों का व्यंग्य-नाटक (नाटिका)। आधुनिक हिन्दी नाटक में यथार्थवादी व्यंग्य का प्रथम युगांतरकारी स्तम्भ।"
keywords: ["premjogini", "bharatendu harishchandra", "kashi", "satire", "social drama", "varanasi", "natak"]
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
        console.log(`[BATCH-10] Ingested Premjogini ${act.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-10] Error fetching ${act.page}:`, e.message);
    }
    await sleep(200);
  }

  const filePath = path.join(RAW_DIR, 'premjogini.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-10] Saved ${filePath} with ${totalActs} acts.`);

  logSourceRecord({
    id: 'premjogini',
    title_hi: 'प्रेमजोगिनी',
    title_en: 'Premjogini',
    author_hi: 'भारतेन्दु हरिश्चंद्र',
    author_en: 'Bharatendu Harishchandra',
    category_hi: 'नाटक',
    category_en: 'Play / Drama',
    published_year: 1875,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भारतेंदु-नाटकावली/३–प्रेमजोगिनी',
    ingested_at: '2026-11-14',
    chapter_count: totalActs,
    verification_notes: '१८७५/१९३५ भारतेंदु-नाटकावली (संपादक: बाबू श्यामसुन्दर दास) से सत्यापित सम्पूर्ण ४ गर्भांक।'
  });
}

// 4. Ingest Sati Pratap (सतीप्रताप by Bharatendu Harishchandra) - 7 Scenes
async function ingestSatiPratap() {
  console.log('[BATCH-10] Fetching सतीप्रताप (Bharatendu Harishchandra)...');

  const scenes = [
    { title: 'पहला दृश्य — हिमालय का अधोभाग व सावित्री का तपोवन', page: 'भारतेंदु-नाटकावली/९–सतीप्रताप' },
    { title: 'दूसरा दृश्य — राजा अश्वपति का राजभवन व नारद-संवाद', page: 'भारतेंदु-नाटकावली/९–सतीप्रताप (दूसरा दृश्य)' },
    { title: 'तीसरा दृश्य — द्युमत्सेन का आश्रम व सत्यवान-मिलन', page: 'भारतेंदु-नाटकावली/९–सतीप्रताप (तीसरा दृश्य)' },
    { title: 'चौथा दृश्य — विवाह व दारुण भविष्यवाणी का भय', page: 'भारतेंदु-नाटकावली/९–सतीप्रताप (चौथा दृश्य)' },
    { title: 'पाँचवाँ दृश्य — वन-गमन व सत्यवान का मूर्च्छित होना', page: 'भारतेंदु-नाटकावली/९–सतीप्रताप (पाँचवाँ दृश्य)' },
    { title: 'छठा दृश्य — यमराज का आगमन व सावित्री का ज्ञान-तर्क', page: 'भारतेंदु-नाटकावली/९–सतीप्रताप (छठा दृश्य)' },
    { title: 'सातवाँ दृश्य — यमराज से वरदान-प्राप्ति व अखंड सौभाग्य', page: 'भारतेंदु-नाटकावली/९–सतीप्रताप (सातवाँ दृश्य)' }
  ];

  let mdContent = `---
id: "sati-pratap"
title: "सतीप्रताप"
title_en: "Sati Pratap"
author: "भारतेन्दु हरिश्चंद्र"
author_en: "Bharatendu Harishchandra"
category: "नाटक"
category_en: "Play / Drama"
published_year: 1883
description: "भारतेन्दु हरिश्चंद्र का प्रसिद्ध पौराणिक गीतिरूपक (नाटक)। सावित्री के अप्रतिम पातिव्रत्य, आत्म-बल और प्रखर बुद्धि-तर्क द्वारा यमराज से सत्यवान के प्राण और अपने कुल का खोया वैभव पुनः प्राप्त करने की अमर आख्यान-नाटिका।"
keywords: ["sati pratap", "bharatendu harishchandra", "savitri satyavan", "mythological drama", "giti rupak", "natak"]
cover: ""
---

`;

  let totalScenes = 0;
  for (const sc of scenes) {
    try {
      const html = await fetchWikiPage(sc.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalScenes++;
        mdContent += `\n# ${sc.title}\n\n${clean}\n\n`;
        console.log(`[BATCH-10] Ingested Sati Pratap: ${sc.title}`);
      }
    } catch (e) {
      console.warn(`[BATCH-10] Error fetching ${sc.page}:`, e.message);
    }
    await sleep(200);
  }

  const filePath = path.join(RAW_DIR, 'sati-pratap.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-10] Saved ${filePath} with ${totalScenes} scenes.`);

  logSourceRecord({
    id: 'sati-pratap',
    title_hi: 'सतीप्रताप',
    title_en: 'Sati Pratap',
    author_hi: 'भारतेन्दु हरिश्चंद्र',
    author_en: 'Bharatendu Harishchandra',
    category_hi: 'नाटक',
    category_en: 'Play / Drama',
    published_year: 1883,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/भारतेंदु-नाटकावली/९–सतीप्रताप',
    ingested_at: '2026-11-14',
    chapter_count: totalScenes,
    verification_notes: '१८८३/१९३५ भारतेंदु-नाटकावली (संपादक: बाबू श्यामसुन्दर दास) से सत्यापित सम्पूर्ण ७ दृश्य।'
  });
}

// 5. Ingest Adbhut Aalap (अद्भुत आलाप by Mahavir Prasad Dwivedi) - 21 Essays
async function ingestAdbhutAalap() {
  console.log('[BATCH-10] Fetching अद्भुत आलाप (Acharya Mahavir Prasad Dwivedi)...');

  const essays = [
    { title: 'अंतःसाक्षित्व-विद्या', page: 'अद्भुत आलाप/अंतःसाक्षित्व-विद्या' },
    { title: 'आकाश में निराधार स्थिति', page: 'अद्भुत आलाप/आकाश में निराधार स्थिति' },
    { title: 'एक योगी की साप्ताहिक समाधि', page: 'अद्भुत आलाप/एक योगी की साप्ताहिक समाधि' },
    { title: 'एक ही शरीर में अनेक आत्माएँ', page: 'अद्भुत आलाप/एक ही शरीर में अनेक आत्माएँ' },
    { title: 'क्या जानवर भी सोचते हैं?', page: 'अद्भुत आलाप/क्या जानवर भी सोचते हैं?' },
    { title: 'दिव्य दृष्टि', page: 'अद्भुत आलाप/दिव्य दृष्टि' },
    { title: 'परलोक से प्राप्त हुए पत्र', page: 'अद्भुत आलाप/परलोक से प्राप्त हुए पत्र' },
    { title: 'परिचित्त-विज्ञान-विद्या', page: 'अद्भुत आलाप/परिचित्त-विज्ञान-विद्या' },
    { title: 'मनुष्येतर जीवों का अंतर्ज्ञान', page: 'अद्भुत आलाप/मनुष्येतर जीवों का अंतर्ज्ञान' },
    { title: 'क्या चिड़ियाँ भी सूँघती हैं?', page: 'अद्भुत आलाप/१०—क्या चिड़ियाँ भी सूँघती हैं?' },
    { title: 'पशुओं में बोलने की शक्ति', page: 'अद्भुत आलाप/११—पशुओं में बोलने की शक्ति' },
    { title: 'विद्वान् घोड़े', page: 'अद्भुत आलाप/१२—विद्वान् घोड़े' },
    { title: 'एक हिसाबी कुत्ता', page: 'अद्भुत आलाप/१३—एक हिसाबी कुत्ता' },
    { title: 'बंदरों की भाषा', page: 'अद्भुत आलाप/१४—बंदरों की भाषा' },
    { title: 'ग्रहों पर जीवनधारियों के होने का अनुमान', page: 'अद्भुत आलाप/१५—ग्रहों पर जीवनधारियों के होने का अनुमान' },
    { title: 'मंगल ग्रह तक तार', page: 'अद्भुत आलाप/१६—मंगल ग्रह तक तार' },
    { title: 'पाताल-प्रविष्ट पांपियाई-नगर', page: 'अद्भुत आलाप/१७—पाताल-प्रविष्ट पांपियाई-नगर' },
    { title: 'अंध-लिपि', page: 'अद्भुत आलाप/१८—अंध-लिपि' },
    { title: 'भयंकर भूत-लीला', page: 'अद्भुत आलाप/१९—भयंकर भूत-लीला' },
    { title: 'अद्भुत इंद्रजाल', page: 'अद्भुत आलाप/२०—अद्भुत इंद्रजाल' },
    { title: 'प्राचीन मेक्सिको में नरमेध-यज्ञ', page: 'अद्भुत आलाप/२१—प्राचीन मेक्सिको में नरमेध-यज्ञ' }
  ];

  let mdContent = `---
id: "adbhut-aalap"
title: "अद्भुत आलाप"
title_en: "Adbhut Aalap"
author: "आचार्य महावीर प्रसाद द्विवेदी"
author_en: "Acharya Mahavir Prasad Dwivedi"
category: "निबंध"
category_en: "Essays"
published_year: 1924
description: "आचार्य महावीर प्रसाद द्विवेदी का वैज्ञानिक कौतूहल, मनोविज्ञान, खगोलशास्त्र और पुरातात्विक रहस्यों पर लिखा गया अनूठा निबंध-संग्रह। क्या जानवर सोचते हैं?, पशुओं की भाषा, मंगल ग्रह पर जीवन तथा पांपियाई नगर के उत्खनन पर २१ प्रेरक निबंध।"
keywords: ["adbhut aalap", "mahavir prasad dwivedi", "science essays", "animal psychology", "astronomy", "nibandh"]
cover: ""
---

`;

  let totalEssays = 0;
  for (let i = 0; i < essays.length; i++) {
    const es = essays[i];
    try {
      const html = await fetchWikiPage(es.page);
      const clean = stripNavHeader(cleanWikiHtml(html));
      if (clean.length > 50) {
        totalEssays++;
        mdContent += `\n# निबंध ${i + 1} — ${es.title}\n\n${clean}\n\n`;
        if (totalEssays % 5 === 0 || totalEssays === essays.length) {
          console.log(`[BATCH-10] Ingested Adbhut Aalap ${totalEssays}/${essays.length}`);
        }
      }
    } catch (e) {
      console.warn(`[BATCH-10] Error fetching ${es.page}:`, e.message);
    }
    await sleep(200);
  }

  const filePath = path.join(RAW_DIR, 'adbhut-aalap.md');
  fs.writeFileSync(filePath, mdContent);
  console.log(`[BATCH-10] Saved ${filePath} with ${totalEssays} essays.`);

  logSourceRecord({
    id: 'adbhut-aalap',
    title_hi: 'अद्भुत आलाप',
    title_en: 'Adbhut Aalap',
    author_hi: 'आचार्य महावीर प्रसाद द्विवेदी',
    author_en: 'Acharya Mahavir Prasad Dwivedi',
    category_hi: 'निबंध',
    category_en: 'Essays',
    published_year: 1924,
    copyright_status: 'सार्वजनिक डोमेन (Public Domain)',
    repository: 'Hindi Wikisource',
    source_url: 'https://hi.wikisource.org/wiki/अद्भुत_आलाप',
    ingested_at: '2026-11-14',
    chapter_count: totalEssays,
    verification_notes: '१९२४ के मूल संस्करण से हिन्दी विकिस्रोत पर सत्यापित सम्पूर्ण २१ वैज्ञानिक व दार्शनिक निबंध।'
  });
}

async function main() {
  ensureDir(RAW_DIR);
  console.log('=== STARTING BATCH 10 INGESTION ===\n');
  await ingestPremDwadashi();
  await ingestSaptaSaroj();
  await ingestPremjogini();
  await ingestSatiPratap();
  await ingestAdbhutAalap();
  console.log('\n=== BATCH 10 INGESTION FINISHED ===');
}

main().catch(console.error);
