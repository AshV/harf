const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function printKarmabhoomiPages() {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent('कर्मभूमि/')}&aplimit=100&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  const pages = (data.query?.allpages || []).map(p => p.title);
  console.log('Karmabhoomi pages count:', pages.length);
  console.log('Sample pages:', pages.slice(0, 20));
}

printKarmabhoomiPages();
