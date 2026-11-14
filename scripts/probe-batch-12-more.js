import https from 'node:https';

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'HarfBot/1.0 (https://github.com/harf; harf@example.com)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function checkPrefix(prefix) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  const pages = res?.query?.allpages || [];
  console.log(`\n=== Prefix: "${prefix}" (${pages.length} pages found) ===`);
  pages.slice(0, 20).forEach(p => console.log(' - ' + p.title));
  return pages;
}

async function getPage(title) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`;
  const res = await fetchJson(url);
  const text = res?.parse?.text?.['*'] || '';
  const clean = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 300);
  console.log(`\n=== Page: "${title}" ===\n${clean}`);
}

async function main() {
  await getPage('कहानी खत्म हो गई/आंके-बांके राजपूत');
  await getPage('एक घूँट');
  await checkPrefix('काव्य और कला तथा अन्य निबन्ध');
  await checkPrefix('पाँच फूल');
  await checkPrefix('मेरी आत्मकहानी');
  await checkPrefix('रेवातट (पृथ्वीराज-रासो)/');
}

main().catch(console.error);
