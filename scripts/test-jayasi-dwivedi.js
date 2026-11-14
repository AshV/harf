const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function listSubpages(prefix) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=60&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const pages = (data.query?.allpages || []).map(p => p.title);
    console.log(`Subpages of "${prefix}" (${pages.length}):`, pages.slice(0, 15));
    return pages;
  } catch (err) {
    console.error(`[ERROR] "${prefix}":`, err.message);
    return [];
  }
}

async function testPage(title) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  const html = data.parse?.text?.['*'] || '';
  console.log(`[TEST] "${title}" -> HTML length: ${html.length}`);
}

async function run() {
  await listSubpages('रसज्ञ-रञ्जन');
  await listSubpages('जायसी ग्रंथावली');
  await testPage('रसज्ञ-रञ्जन/८—कवियों की ऊर्म्मिला-विषयक उदासीनता');
  await testPage('रसज्ञ-रञ्जन/१-कवि-कर्त्तव्य १');
}

run();
