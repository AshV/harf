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
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=8&format=json`;
  const res = await fetchJson(url);
  const results = res?.query?.search || [];
  console.log(`\n=== Search: "${query}" (${results.length} matches) ===`);
  results.forEach(r => console.log(` - ${r.title} (${r.wordcount} words)`));
  return results;
}

async function main() {
  await checkPrefix('आदर्श हिंदू');
  await checkPrefix('चन्द्रकांता सन्तति 4');
  await checkPrefix('चन्द्रकांता सन्तति 5');
  await checkPrefix('चन्द्रकांता सन्तति 6');
  await checkPrefix('मानसरोवर ३');
  await checkPrefix('मानसरोवर ४');
  await checkPrefix('मानसरोवर ५');
  await searchWiki('सरयूपार की यात्रा भारतेन्दु');
  await checkPrefix('सरयूपार की यात्रा');
  await searchWiki('ठेठ हिन्दी का ठाठ');
  await checkPrefix('ठेठ हिन्दी का ठाठ');
  await searchWiki('रस-कुसुम हरिऔध');
  await checkPrefix('रस-कुसुम');
  await searchWiki('वैशाली की नगरवधू');
  await checkPrefix('वैशाली की नगरवधू');
  await searchWiki('जासूस की चोरी');
  await searchWiki('गोपालराम गहमरी');
  await searchWiki('किशोरीलाल गोस्वामी');
  await searchWiki('सोमनाथ चतुरसेन');
}

main().catch(console.error);
