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

async function main() {
  const titles = [
    'Index:ऊषा-अनिरुद्ध.djvu',
    'ऊषा-अनिरुद्ध/भूमिका',
    'Index:हिंदी व्याकरण (कामताप्रसाद गुरु).djvu',
    'हिंदी व्याकरण',
    'Index:भाव-विलास.djvu',
    'भाव-विलास/प्रथम विलास/ग्रन्थ-परिचय',
    'हिंदी निबंधमाला-१'
  ];

  for (const t of titles) {
    const url = `https://hi.wikisource.org/w/api.php?action=query&prop=revisions&titles=${encodeURIComponent(t)}&rvprop=content&rvslots=main&format=json`;
    const res = await fetchJson(url);
    const pages = res?.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    const content = pages[pageId]?.revisions?.[0]?.slots?.main?.['*'] || '';
    if (content) {
      console.log(`\n=== Title: ${t} ===`);
      console.log(content.slice(0, 400));
    }
  }
}

main().catch(console.error);
