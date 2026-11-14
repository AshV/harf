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

async function main() {
  await checkPrefix('सौ अजान और एक सुजान');
  await checkPrefix('प्रताप पीयूष');
  await checkPrefix('आदर्श हिंदू');
  await checkPrefix('आदर्श हिन्दू');
  await checkPrefix('कविता-कौमुदी');
  await checkPrefix('चन्द्रकान्ता सन्तति 3');
  await checkPrefix('चन्द्रकांता सन्तति 3');
  await checkPrefix('चन्द्रकांता संतति (भाग ३)');
  await checkPrefix('बिहारी बिहार');
  await checkPrefix('आश्चर्य वृत्तान्त');
  await checkPrefix('प्रसाद वाङ्मय');
}

main().catch(console.error);
