const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function listSubpages(prefix) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=50&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  const pages = (data.query?.allpages || []).map(p => p.title);
  console.log(`[SUBPAGES] "${prefix}" (${pages.length} pages):`, pages);
  return pages;
}

async function run() {
  await listSubpages('चिन्तामणि');
  await listSubpages('चिंतामणि');
}

run();
