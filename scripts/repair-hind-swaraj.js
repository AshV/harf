import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const RAW_FILE = path.resolve('content/raw/hind-swaraj.md');
const EPUB_DIR = '/tmp/hind_swaraj/EPUB';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchHindisamayText(partIndex, retries = 3) {
  const url = `https://hindisamay.com/content/4708/${partIndex}/x.cspx`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const m = html.match(/id="ContentPlaceHolder1_lblContentText"[^>]*>([\s\S]*?)<\/span>/i);
      if (!m) return '';
      let text = m[1];
      text = text.replace(/<br\s*\/?>/gi, '\n');
      text = text.replace(/<\/p>/gi, '\n\n');
      text = text.replace(/<[^>]+>/g, '');
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/&zwj;/g, '');
      text = text.replace(/&zwnj;/g, '');
      text = text.replace(/&lt;/g, '<');
      text = text.replace(/&gt;/g, '>');
      text = text.replace(/&quot;/g, '"');
      text = text.replace(/&#39;/g, "'");
      text = text.replace(/&amp;/g, '&');
      text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      text = text.replace(/\n{3,}/g, '\n\n');
      return text.trim();
    } catch (e) {
      console.warn(`[RETRY ${attempt}/${retries}] Failed to fetch part ${partIndex}: ${e.message}`);
      await sleep(1500 * attempt);
    }
  }
  return '';
}

function cleanEpubPage(p) {
  const pPath = path.join(EPUB_DIR, `page_${p}.html`);
  if (!fs.existsSync(pPath)) return '';
  const raw = fs.readFileSync(pPath, 'utf-8');
  let t = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  t = t.replace(/Page\s+\d+/gi, '');
  t = t.replace(/(?:[्‌बीककरं\|]*\s*(?:855|355|\d+)\.?\s*|[\*\#\~]\s*)?हिन्द\s+स्वराज्य/gi, '');
  t = t.replace(/\s+\d+\s*$/, '');
  return t.trim();
}

function getBody(chText) {
  return chText.replace(/^#\s+[^\n]+\n/, '').trim();
}

export async function repairHindSwaraj() {
  console.log('Beginning repair of हिन्द स्वराज (Hind Swaraj)...');

  const origHead = execSync('git show HEAD:content/raw/hind-swaraj.md').toString();
  const headChapters = origHead.split(/\n(?=# )/);

  // Frontmatter
  const frontmatter = headChapters[0].trim();

  // Chapters from HEAD (Gandhi Hindustani Sahitya Sabha Navajivan text)
  const ch1Body = getBody(headChapters[4]); // Was # ३
  const ch5Body = getBody(headChapters[5]); // Was # ४
  const ch8Body = getBody(headChapters[6]); // Was # ५

  console.log('Fetching missing chapters from Hindisamay...');
  const ch2 = await fetchHindisamayText(3);
  const ch3 = await fetchHindisamayText(4);
  const ch4 = await fetchHindisamayText(5);
  const ch6 = await fetchHindisamayText(7);
  const ch7 = await fetchHindisamayText(8);
  const ch9 = await fetchHindisamayText(10);
  const ch10 = await fetchHindisamayText(11);

  // Chapter 11 (वकील) from EPUB
  let ch11 = [73, 74, 75, 76, 77]
    .map(cleanEpubPage)
    .join(' ')
    .replace(/^[\s\S]*?(पाठक\s*:)/, '$1')
    .replace(/जनननिनन[\s\S]*$/, '')
    .trim();

  // Chapter 12 (डॉक्टर) from EPUB
  let ch12 = [79, 80, 81]
    .map(cleanEpubPage)
    .join(' ')
    .replace(/^[\s\S]*?(पाठक\s*:)/, '$1')
    .trim();

  const ch13 = await fetchHindisamayText(14);
  const ch14 = await fetchHindisamayText(15);
  const ch15 = await fetchHindisamayText(16);
  const ch16 = await fetchHindisamayText(17);
  const ch17 = await fetchHindisamayText(18);
  const ch18 = await fetchHindisamayText(19);
  const ch19 = await fetchHindisamayText(20);
  const ch20 = await fetchHindisamayText(21);
  const appendix = await fetchHindisamayText(22);

  const chapters = [
    { title: '१. कांग्रेस और उसके कर्ता-धर्ता', body: ch1Body },
    { title: '२. बंग-भंग', body: ch2 },
    { title: '३. अशांति और असंतोष', body: ch3 },
    { title: '४. स्वराज्य क्या है?', body: ch4 },
    { title: '५. इंग्लैंड की हालत', body: ch5Body },
    { title: '६. सभ्यता का दर्शन', body: ch6 },
    { title: '७. हिन्दुस्तान कैसे गया?', body: ch7 },
    { title: '८. हिन्दुस्तान की दशा (१)', body: ch8Body },
    { title: '९. हिन्दुस्तान की दशा (२) : रेलवे', body: ch9 },
    { title: '१०. हिन्दुस्तान की दशा (३) : हिन्दू और मुसलमान', body: ch10 },
    { title: '११. हिन्दुस्तान की दशा (४) : वकील', body: ch11 },
    { title: '१२. हिन्दुस्तान की दशा (५) : डॉक्टर', body: ch12 },
    { title: '१३. सच्ची सभ्यता कौन-सी?', body: ch13 },
    { title: '१४. हिन्दुस्तान कैसे आज़ाद हो?', body: ch14 },
    { title: '१५. इटली और हिन्दुस्तान', body: ch15 },
    { title: '१६. गोला-बारूद', body: ch16 },
    { title: '१७. सत्याग्रह — आत्मबल', body: ch17 },
    { title: '१८. शिक्षा', body: ch18 },
    { title: '१९. मशीनें', body: ch19 },
    { title: '२०. छुटकारा (उपसंहार)', body: ch20 },
    { title: 'परिशिष्ट : सम्मति और सन्दर्भ पुस्तकें', body: appendix }
  ];

  let assembled = frontmatter + '\n\n';

  for (const c of chapters) {
    if (!c.body || c.body.length < 50) {
      throw new Error(`Chapter "${c.title}" has insufficient body length: ${c.body?.length || 0}`);
    }
    assembled += `# ${c.title}\n\n${c.body}\n\n`;
  }

  assembled = assembled.trim() + '\n';
  fs.writeFileSync(RAW_FILE, assembled, 'utf-8');
  console.log(`Successfully repaired ${RAW_FILE}! Total size: ${assembled.length} characters.`);
}

if (process.argv[1] && process.argv[1].endsWith('repair-hind-swaraj.js')) {
  repairHindSwaraj();
}
