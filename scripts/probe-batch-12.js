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
  await checkPrefix('कहानी खत्म हो गई');
  await checkPrefix('कर्पूर मंजरी');
  await searchWiki('कर्पूर मंजरी भारतेन्दु');
  await checkPrefix('विद्यासुन्दर');
  await searchWiki('विद्यासुन्दर भारतेन्दु');
  await checkPrefix('प्रेम-पथिक');
  await searchWiki('प्रेम-पथिक जयशंकर प्रसाद');
  await checkPrefix('कानन कुसुम');
  await searchWiki('कानन कुसुम जयशंकर प्रसाद');
  await checkPrefix('नवनिधि');
  await checkPrefix('सप्त सुमन');
  await searchWiki('नवनिधि प्रेमचंद');
  await checkPrefix('सुजान चरित');
  await searchWiki('सुजान चरित सूदन');
}

main().catch(console.error);
