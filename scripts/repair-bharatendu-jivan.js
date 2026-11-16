import fs from 'fs';
import path from 'path';

const RAW_FILE = path.resolve('content/raw/bharatendu-jivan-charitra.md');

async function fetchWikiPage(title, retries = 3) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`;
  for (let a = 1; a <= retries; a++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'HarfDigitalLibrary/1.0 (dev.harflibrary@gmail.com)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data?.parse?.text?.['*'] || '';
    } catch (e) {
      console.warn(`[RETRY ${a}/${retries}] Failed to fetch "${title}": ${e.message}`);
      await new Promise((r) => setTimeout(r, 1500 * a));
    }
  }
  return '';
}

function cleanWikiText(html) {
  let t = html
    .replace(/<div class="thumb[^"]*"[\s\S]*?<\/div>/gi, '')
    .replace(/<table[\s\S]*?<\/table>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#8203;/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&zwj;/g, '')
    .replace(/&zwnj;/g, '')
    .replace(/&#160;/g, ' ')
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Strip Wikisource navigation header
  t = t.replace(/^←[^\n]+\n[^\n]+\n[०-९\d]+[^\n]+\n/g, '').trim();
  t = t.replace(/^_{5,}\s*/, '').trim();
  t = t.replace(/^\([०-९\d]+\)\s*भारतेन्दु[^\n]*\n/, '').trim();
  return t.trim();
}

export async function repairBharatenduJivan() {
  console.log('Repairing भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र...');

  const html3 = await fetchWikiPage('भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/3');
  const html5 = await fetchWikiPage('भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/5');

  const text3 = cleanWikiText(html3);
  const text5 = cleanWikiText(html5);

  console.log('Ch 3 length:', text3.length, 'Ch 5 length:', text5.length);

  const content = fs.readFileSync(RAW_FILE, 'utf-8');
  const chapters = content.split(/\n(?=# )/);

  // Chapter 3 is index 3, Chapter 5 is index 5
  chapters[3] = '# अध्याय ३: रचनाएँ, नाटक एवं पत्र-पत्रिकाएँ\n\n' + text3;
  chapters[5] = '# अध्याय ५: जीवन की अंतिम अवस्था एवं देहावसान\n\n' + text5;

  const assembled = chapters.join('\n\n').trim() + '\n';
  fs.writeFileSync(RAW_FILE, assembled, 'utf-8');
  console.log('Successfully repaired bharatendu-jivan-charitra.md!');
}

if (process.argv[1] && process.argv[1].endsWith('repair-bharatendu-jivan.js')) {
  repairBharatenduJivan();
}
