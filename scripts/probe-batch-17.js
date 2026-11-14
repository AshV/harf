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
  await searchWiki('उसने कहा था');
  await checkPrefix('उसने कहा था');
  await searchWiki('चन्द्रधर शर्मा गुलेरी');
  await checkPrefix('भूतनाथ');
  await searchWiki('भूतनाथ देवकीनंदन');
  await checkPrefix('कुसुम कुमारी');
  await checkPrefix('नरेन्द्र मोहिनी');
  await checkPrefix('वीरेन्द्र वीर');
  await checkPrefix('आग और धुआं');
  await checkPrefix('मानसरोवर १');
  await checkPrefix('साकेत');
  await searchWiki('साकेत मैथिलीशरण');
  await checkPrefix('जयद्रथ वध');
  await checkPrefix('जयद्रथ-वध');
  await searchWiki('जयद्रथ-वध मैथिलीशरण');
  await checkPrefix('यशोधरा');
  await checkPrefix('बालकृष्ण भट्ट');
  await searchWiki('बालकृष्ण भट्ट');
  await checkPrefix('प्रताप नारायण मिश्र');
  await searchWiki('प्रताप नारायण मिश्र');
  await checkPrefix('नाटक');
  await searchWiki('नाटक भारतेन्दु');
}

main().catch(console.error);
