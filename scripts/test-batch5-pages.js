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
  console.log(`All subpages of "${prefix}" (${pages.length}):`, pages.slice(0, 10));
  return pages;
}

async function run() {
  await testPage('स्कंदगुप्त/प्रथम अंक');
  await testPage('स्कंदगुप्त/पंचम अंक');
  await testPage('रहीम-कवितावली/दोहे');
  await testPage('रहीम-कवितावली/मदनाष्टक');
  await testPage('कवितावली/बालकाण्ड');
  await testPage('कवितावली/उत्तरकाण्ड');
  await listAllSubpages('कवितावली');
  await listAllSubpages('तितली');
  await listAllSubpages('सेवासदन/');
}

run();
