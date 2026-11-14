const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function listSubpages(prefix) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=50&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const pages = (data.query?.allpages || []).map(p => p.title);
    console.log(`[SUBPAGES] "${prefix}" (${pages.length} pages):`, pages.slice(0, 15));
    return pages;
  } catch (err) {
    console.error(`[ERROR] "${prefix}":`, err.message);
    return [];
  }
}

async function searchWiki(term) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=8&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const titles = (data.query?.search || []).map(s => s.title);
    console.log(`[SEARCH] "${term}":`, titles);
  } catch (err) {
    console.error(`[ERROR search] "${term}":`, err.message);
  }
}

async function run() {
  console.log('--- Probing Batch 4 candidates ---');
  await listSubpages('प्रियप्रवास');
  await listSubpages('परीक्षा गुरु');
  await listSubpages('गबन');
  await listSubpages('सेवासदन');
  await listSubpages('बिहारी-रत्नाकर');
  await searchWiki('पंचवटी मैथिलीशरण');
  await searchWiki('भारत-भारती');
  await searchWiki('जयद्रथ वध');
  await searchWiki('वैदिकी हिंसा हिंसा न भवति');
}

run();
