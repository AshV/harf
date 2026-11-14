const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function checkWikiPage(title) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=info|extracts&exintro=1&explaintext=1&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const pages = data.query?.pages || {};
    for (const [id, page] of Object.entries(pages)) {
      if (id === '-1') {
        console.log(`[MISSING] "${title}"`);
      } else {
        console.log(`[FOUND] "${title}" -> PageID: ${id}, Length: ${page.length}`);
      }
    }
  } catch (err) {
    console.error(`[ERROR] "${title}":`, err.message);
  }
}

async function searchWiki(query) {
  const url = `https://hi.wikisource.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    console.log(`[SEARCH] "${query}" ->`, data[1]);
  } catch (err) {
    console.error(`[ERROR search] "${query}":`, err.message);
  }
}

async function run() {
  console.log('--- Probing Hindi Wikisource for candidate works ---');
  await searchWiki('उसने कहा था');
  await searchWiki('मुकुल');
  await searchWiki('झाँसी की रानी');
  await searchWiki('ध्रुवस्वामिनी');
  await searchWiki('आँसू');
  await searchWiki('नीलदेवी');
  await searchWiki('परीक्षा गुरु');
  await searchWiki('शिवशम्भु के चिट्ठे');
  await searchWiki('साकेत');
  await searchWiki('पंचवटी');
  await searchWiki('गबन');
  await searchWiki('सेवासदन');
}

run();
