const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function wikiQuerySearch(term) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=8&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    const titles = (data.query?.search || []).map(s => s.title);
    console.log(`[QUERY] "${term}" ->`, titles);
  } catch (err) {
    console.error(`[ERROR] "${term}":`, err.message);
  }
}

async function run() {
  await wikiQuerySearch('उसने कहा था');
  await wikiQuerySearch('गुलेरी');
  await wikiQuerySearch('सुभद्रा कुमारी चौहान');
  await wikiQuerySearch('झाँसी की रानी');
  await wikiQuerySearch('आँसू जयशंकर प्रसाद');
  await wikiQuerySearch('जयशंकर प्रसाद');
  await wikiQuerySearch('मैथिलीशरण गुप्त');
  await wikiQuerySearch('साकेत मैथिलीशरण');
  await wikiQuerySearch('कबीर');
  await wikiQuerySearch('बिहारी सतसई');
}

run();
