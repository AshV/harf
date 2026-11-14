const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function printSubpages(prefix) {
  const url = `https://hi.wikisource.org/w/api.php?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=20&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  const data = await res.json();
  const pages = (data.query?.allpages || []).map(p => p.title);
  console.log(`Subpages of "${prefix}":`, pages);
}

async function run() {
  await printSubpages('शिवशम्भु के चिट्ठे');
  await printSubpages('भारतेंदु-नाटकावली/७–नीलदेवी');
  await printSubpages('प्रसाद वाङ्मय द्वितीय खण्ड/ध्रुवस्वामिनी');
  await printSubpages('कबीर ग्रंथावली');
  await printSubpages('जयशंकर प्रसाद की श्रेष्ठ कहानियां');
}

run();
