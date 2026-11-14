const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function printKarmabhoomiAll() {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('कर्मभूमि/')}&aplimit=100&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  const pages = (data.query?.allpages || []).map(p => p.title);
  console.log(JSON.stringify(pages, null, 2));
}

printKarmabhoomiAll();
