const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function checkPrakaranNames() {
  const candidates = [];
  for (let i = 1; i <= 41; i++) {
    // Check possible variants
    candidates.push(`परीक्षा गुरु/प्रकरण ${i}`);
    candidates.push(`परीक्षा गुरु/${i}`);
    candidates.push(`परीक्षा गुरु ${i}`);
  }

  const url = `https://hi.wikisource.org/w/api.php?action=query&titles=${encodeURIComponent(candidates.slice(0, 50).join('|'))}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  const pages = data.query?.pages || {};
  const valid = [];
  for (const [id, p] of Object.entries(pages)) {
    if (id !== '-1') {
      valid.push(p.title);
    }
  }
  console.log('Sample valid pages:', valid.sort());
}

checkPrakaranNames();
