const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function printSubpages(prefix) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=20&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  const pages = (data.query?.allpages || []).map(p => p.title);
  console.log(`Subpages of "${prefix}":`, pages);
}

async function run() {
  await printSubpages('परीक्षा गुरु');
  await printSubpages('प्रियप्रवास');
}

run();
