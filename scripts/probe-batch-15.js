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
  await checkPrefix('साहित्यालाप');
  await checkPrefix('धर्म के नाम पर');
  await checkPrefix('प्रेमसागर');
  await checkPrefix('करुणालय');
  await searchWiki('करुणालय जयशंकर प्रसाद');
  await checkPrefix('महाराणा का महत्त्व');
  await searchWiki('महाराणा का महत्त्व प्रसाद');
  await checkPrefix('वैदिकी हिंसा हिंसा न भवति');
  await checkPrefix('विषस्य विषमौषधम्');
  await checkPrefix('उद्धव शतक');
  await searchWiki('उद्धव शतक रत्नाकर');
  await checkPrefix('गंगावतरण');
  await searchWiki('गंगावतरण रत्नाकर');
  await checkPrefix('जानकी मंगल');
  await checkPrefix('पार्वती मंगल');
  await checkPrefix('कविता-कौमुदी');
  await checkPrefix('अयोध्या का इतिहास');
  await searchWiki('अयोध्या का इतिहास लाला सीताराम');
  await checkPrefix('नासकेतोपाख्यान');
  await checkPrefix('माधव विलास');
}

main().catch(console.error);
