const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function searchWiki(term) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=8&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const titles = (data.query?.search || []).map(s => s.title);
    console.log(`[SEARCH] "${term}":`, titles);
    return titles;
  } catch (err) {
    console.error(`[ERROR search] "${term}":`, err.message);
    return [];
  }
}

async function listSubpages(prefix) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=60&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const pages = (data.query?.allpages || []).map(p => p.title);
    console.log(`[SUBPAGES] "${prefix}" (${pages.length} pages):`, pages.slice(0, 10));
    return pages;
  } catch (err) {
    console.error(`[ERROR subpages] "${prefix}":`, err.message);
    return [];
  }
}

async function run() {
  console.log('--- Probing Batch 6 candidates ---');
  await listSubpages('गबन');
  await listSubpages('तितली');
  await listSubpages('कंकाल');
  await listSubpages('कर्मभूमि');
  await listSubpages('रंगभूमि');
  await searchWiki('उसने कहा था गुलेरी');
  await searchWiki('वोल्गा से गंगा');
  await searchWiki('कुल्ली भाट');
  await searchWiki('चतुरी चमार');
  await searchWiki('उन्मादिनी');
}

run();
