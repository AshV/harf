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
  await searchWiki('सुदामा चरित');
  await checkPrefix('सुदामा चरित');
  await searchWiki('विद्यासुन्दर भारतेन्दु');
  await checkPrefix('विद्यासुन्दर');
  await searchWiki('कर्पूर मंजरी');
  await checkPrefix('कर्पूर मंजरी');
  await searchWiki('प्रेम पथिक');
  await checkPrefix('प्रेम-पथिक');
  await searchWiki('कानन कुसुम');
  await checkPrefix('कानन कुसुम');
  await searchWiki('चतुरसेन शास्त्री');
  await checkPrefix('कहानी खत्म हो गई');
  await searchWiki('अधखिला फूल');
  await checkPrefix('अधखिला फूल');
  await searchWiki('रामनरेश त्रिपाठी');
  await searchWiki('मिलन रामनरेश');
  await searchWiki('पथिक रामनरेश');
  await searchWiki('भारत-भारती मैथिलीशरण');
  await checkPrefix('भारत-भारती');
  await searchWiki('पंचवटी मैथिलीशरण');
  await checkPrefix('पंचवटी');
  await searchWiki('नवनिधि प्रेमचंद');
  await checkPrefix('नवनिधि');
  await searchWiki('प्रेम पूर्णिमा');
  await checkPrefix('प्रेम पूर्णिमा');
}

main().catch(console.error);
