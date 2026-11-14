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

async function getPages(prefix) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=100&format=json`;
  const res = await fetchJson(url);
  return (res?.query?.allpages || []).map(p => p.title);
}

async function main() {
  console.log('=== कहानी खत्म हो गई ===');
  const kk = await getPages('कहानी खत्म हो गई');
  console.log(JSON.stringify(kk, null, 2));

  console.log('=== आँधी ===');
  const aandhi = await getPages('आँधी');
  console.log(JSON.stringify(aandhi, null, 2));

  console.log('=== कर्बला ===');
  const karbala = await getPages('कर्बला');
  console.log(JSON.stringify(karbala, null, 2));

  console.log('=== संग्राम ===');
  const sangram = await getPages('संग्राम');
  console.log(JSON.stringify(sangram, null, 2));

  console.log('=== चोखे चौपदे ===');
  const cc = await getPages('चोखे चौपदे');
  console.log(JSON.stringify(cc, null, 2));
}

main().catch(console.error);
