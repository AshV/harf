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
  pages.forEach(p => console.log(' - ' + p.title));
  return pages;
}

async function searchWiki(query) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=10&format=json`;
  const res = await fetchJson(url);
  const results = res?.query?.search || [];
  console.log(`\n=== Search: "${query}" (${results.length} matches) ===`);
  results.forEach(r => console.log(` - ${r.title} (${r.wordcount} words)`));
  return results;
}

async function main() {
  await checkPrefix('परिमल');
  await checkPrefix('गीतिका');
  await checkPrefix('अनामिका');
  await checkPrefix('कुकुरमुत्ता');
  await checkPrefix('प्रेम प्रलाप');
  await checkPrefix('गीत गोविन्दानन्द');
  await checkPrefix('प्रेम माधुरी');
  await checkPrefix('प्रेम तरंग');
  await checkPrefix('प्रेम मालिका');
  await checkPrefix('उत्तरार्द्ध भक्तमाल');
  await searchWiki('उत्तरार्द्ध भक्तमाल भारतेन्दु');
}

main().catch(console.error);
