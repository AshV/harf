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
  await checkPrefix('कुछ विचार');
  await checkPrefix('वरदान');
  await checkPrefix('प्रतिज्ञा');
  await checkPrefix('कर्बला');
  await checkPrefix('संग्राम');
  await checkPrefix('प्रेम की वेदी');
  await checkPrefix('आँधी');
  await checkPrefix('इन्द्रजाल');
  await checkPrefix('प्रतिध्वनि');
  await checkPrefix('छाया');
  await checkPrefix('अजातशत्रु');
  await checkPrefix('विशाख');
  await checkPrefix('राज्यश्री');
  await checkPrefix('जन्मेजय का नागयज्ञ');
  await checkPrefix('चोखे चौपदे');
  await checkPrefix('चुभते चौपदे');
  await checkPrefix('साहित्यालोचन');
  await checkPrefix('हिन्दी भाषा और साहित्य का विकास');
  await searchWiki('अजातशत्रु प्रसाद');
  await searchWiki('वरदान प्रेमचंद');
  await searchWiki('प्रतिज्ञा प्रेमचंद');
}

main().catch(console.error);
