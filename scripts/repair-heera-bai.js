import fs from 'fs';
import path from 'path';

const RAW_FILE = path.resolve('content/raw/heera-bai.md');

async function getWiki(title) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'HarfDigitalLibrary/1.0 (dev.harflibrary@gmail.com)' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await res.json();
  return j.parse?.text?.['*'] || '';
}

function cleanHtml(html) {
  return html
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
    .replace(/&#32;/g, ' ')
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function repairHeeraBai() {
  console.log('Repairing हीराबाई (Heera-Bai)...');

  const p0 = cleanHtml(await getWiki('हीराबाई'));
  const p1 = cleanHtml(await getWiki('हीराबाई/ भाग 1'));
  const p2 = cleanHtml(await getWiki('हीराबाई/ भाग 2'));

  // p0: Chapter 1
  const idx0 = p0.indexOf('पहिला परिच्छेद');
  const ch1Raw = p0.slice(idx0, p0.indexOf('यह कार्य भारत में')).trim();

  // Clean nav headers and footers from p1 and p2
  const cleanNav = (t) =>
    t
      .replace(/←[^\n]+\n[^\n]+\n[^\n]+\n[०-९\d]+[^\n]+\n/g, '')
      .replace(/यह कार्य\s+भारत में[\s\S]*$/, '')
      .replace(/Public domain[\s\S]*$/, '')
      .trim();

  let p2Clean = cleanNav(p2);
  if (!p2Clean.endsWith('इतिश्री।') && !p2Clean.endsWith('इतिश्री')) {
    p2Clean = p2Clean + '\n\nइतिश्री।';
  }

  const fullText = ch1Raw + '\n\n' + cleanNav(p1) + '\n\n' + p2Clean;

  const rawParts = fullText.split(/(?=(?:पहिला|दूसरा|तीसरा|चौथा|पांचवां|छठवां|सातवां|आठवां|नवां|दसवां|ग्यारहवां)\s*परिच्छेद)/);

  const titles = [
    'परिच्छेद १ : अत्याचार',
    'परिच्छेद २ : छुटकारा',
    'परिच्छेद ३ : बहकावट',
    'परिच्छेद ४ : धमकी',
    'परिच्छेद ५ : दृढ़ता',
    'परिच्छेद ६ : प्रत्युपकार',
    'परिच्छेद ७ : परिचय',
    'परिच्छेद ८ : आत्मबलि',
    'परिच्छेद ९ : प्रपंच',
    'परिच्छेद १० : अन्त',
    'परिच्छेद ११ : स्मृति'
  ];

  const chapters = [];
  const validParts = rawParts.filter(p => p.trim().length > 0);

  for (let i = 0; i < validParts.length && i < titles.length; i++) {
    let body = validParts[i].trim();
    // Remove the chapter heading from the body start
    body = body.replace(/^(?:पहिला|दूसरा|तीसरा|चौथा|पांचवां|छठवां|सातवां|आठवां|नवां|दसवां|ग्यारहवां)\s*परिच्छेद।?\s*/, '');
    body = body.replace(/^(?:अत्याचार|छुटकारा|बहकावट|धमकी|दृढ़ता|प्रत्युपकार|परिचय|आत्मबलि|प्रपंच|अन्त|स्मृति)।?\s*/, '');
    // Clean footnotes / page numbers
    body = body.replace(/\([०-९\d]+\)\s*न०/g, '');
    body = body.replace(/\n{3,}/g, '\n\n').trim();

    chapters.push({
      title: titles[i],
      body
    });
  }

  // Read frontmatter
  const orig = fs.readFileSync(RAW_FILE, 'utf-8');
  const frontmatter = orig.split(/\n(?=# )/)[0].trim();

  let assembled = frontmatter + '\n\n';
  for (const c of chapters) {
    assembled += `# ${c.title}\n\n${c.body}\n\n`;
  }
  assembled = assembled.trim() + '\n';

  fs.writeFileSync(RAW_FILE, assembled, 'utf-8');
  console.log(`Successfully repaired ${RAW_FILE}! ${chapters.length} chapters assembled.`);
}

if (process.argv[1] && process.argv[1].endsWith('repair-heera-bai.js')) {
  repairHeeraBai();
}
