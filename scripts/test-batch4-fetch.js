const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function testFetch(title) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const html = data.parse?.text?.['*'] || '';
    console.log(`[TEST] "${title}" -> HTML length: ${html.length}`);
  } catch (err) {
    console.error(`[TEST ERR] "${title}":`, err.message);
  }
}

async function run() {
  await testFetch('प्रियप्रवास/प्रथम सर्ग');
  await testFetch('प्रियप्रवास/सप्तदश सर्ग');
  await testFetch('चिन्तामणि/२—उत्साह');
  await testFetch('चिन्तामणि/११—कविता क्या है');
  await testFetch('परीक्षा गुरु/प्रकरण १');
  await testFetch('परीक्षा गुरु १०');
  await testFetch('बिहारी-रत्नाकर/१');
}

run();
