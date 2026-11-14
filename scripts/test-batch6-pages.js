const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function testPage(title) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const html = data.parse?.text?.['*'] || '';
    console.log(`[TEST] "${title}" -> HTML length: ${html.length}`);
    return html.length;
  } catch (err) {
    console.error(`[TEST ERR] "${title}":`, err.message);
    return 0;
  }
}

async function listAllSubpages(prefix) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=100&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  const pages = (data.query?.allpages || []).map(p => p.title);
  console.log(`Subpages of "${prefix}" (${pages.length}):`, pages.slice(0, 10));
  return pages;
}

async function run() {
  await testPage('चतुरी चमार/चतुरी चमार');
  await testPage('चतुरी चमार/न्याय');
  await testPage('चतुरी चमार/भक्त और भगवान्');
  await testPage('तितली/1.1');
  await testPage('रंगभूमि/१');
  await listAllSubpages('चतुरी चमार');
  await listAllSubpages('रंगभूमि/');
  await listAllSubpages('कर्मभूमि/');
  await listAllSubpages('तितली/');
}

run();
