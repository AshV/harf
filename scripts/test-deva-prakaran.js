const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

const DEVA = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
function toDeva(num) {
  return String(num).split('').map(c => DEVA[parseInt(c, 10)]).join('');
}

async function testDevaPages() {
  for (let i = 1; i <= 5; i++) {
    const devaNum = toDeva(i);
    const variants = [
      `परीक्षा गुरु/प्रकरण ${devaNum}`,
      `परीक्षा गुरु ${devaNum}`,
      `परीक्षा गुरु/${devaNum}`
    ];
    for (const v of variants) {
      try {
        const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(v)}&prop=text&format=json`;
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
        const data = await res.json();
        if (data.parse?.text?.['*']) {
          console.log(`[FOUND] ${v} -> length: ${data.parse.text['*'].length}`);
          break;
        }
      } catch (err) {
        console.error(`Error on ${v}:`, err.message);
      }
    }
  }
}

testDevaPages();
