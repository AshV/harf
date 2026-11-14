const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function printPageContent(title) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext|links&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  console.log(`=== "${title}" ===`);
  console.log('Wikitext snippet:', (data.parse?.wikitext?.['*'] || '').slice(0, 500));
  console.log('Internal links:', (data.parse?.links || []).map(l => l['*']));
}

async function run() {
  await printPageContent('ध्रुवस्वामिनी');
  await printPageContent('नीलदेवी');
  await printPageContent('शिवशम्भु के चिट्ठे');
}

run();
