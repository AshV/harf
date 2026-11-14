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
  await checkPrefix('कुरल-काव्य');
  await checkPrefix('अयोध्या का इतिहास');
  await checkPrefix('जमसेदजी नसरवानजी ताता का जीवन चरित्र');
  await checkPrefix('आग और धुआं');
  await checkPrefix('मीराबाई');
  await searchWiki('मीराबाई की पदावली');
  await checkPrefix('सुजान रसखान');
  await searchWiki('रसखान');
  await checkPrefix('शिवराज भूषण');
  await searchWiki('भूषण शिवराज');
  await checkPrefix('छत्रसाल दशक');
  await checkPrefix('आँसू');
  await searchWiki('आँसू जयशंकर प्रसाद');
  await checkPrefix('झरना');
  await checkPrefix('लहर');
  await checkPrefix('कुल्ली भाट');
  await checkPrefix('उन्मादिनी');
  await checkPrefix('सीधे-सादे चित्र');
  await checkPrefix('मुकुल');
  await checkPrefix('प्रेमाश्रम');
  await checkPrefix('मानसरोवर');
}

main().catch(console.error);
