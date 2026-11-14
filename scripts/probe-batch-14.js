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
  await checkPrefix('माधवराव सप्रे');
  await searchWiki('माधवराव सप्रे');
  await checkPrefix('कंकाल');
  await searchWiki('कंकाल प्रसाद');
  await checkPrefix('इरावती');
  await searchWiki('इरावती प्रसाद');
  await checkPrefix('देवांगना');
  await checkPrefix('धर्म के नाम पर');
  await checkPrefix('आनन्द मठ');
  await checkPrefix('आनंदमठ');
  await searchWiki('आनन्द मठ');
  await checkPrefix('कविता-कौमुदी');
  await checkPrefix('पद्य प्रसून');
  await searchWiki('पद्य प्रसून हरिऔध');
  await checkPrefix('पारिजात');
  await searchWiki('पारिजात हरिऔध');
  await checkPrefix('भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र');
  await checkPrefix('साहित्यालाप');
}

main().catch(console.error);
