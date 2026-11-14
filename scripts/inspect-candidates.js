const USER_AGENT = 'HarfEreader/1.0 (https://harf.pages.dev; contact: dev@harf.app)';

async function inspectPage(title) {
  const url = `https://hi.wikisource.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=text|sections&format=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    const data = await res.json();
    if (data.error) {
      console.log(`[ERR] "${title}":`, data.error.info);
      return;
    }
    const html = data.parse?.text?.['*'] || '';
    const sections = (data.parse?.sections || []).map(s => s.line);
    console.log(`[OK] "${title}" -> HTML length: ${html.length}, Sections: ${sections.length}`);
    if (sections.length > 0) {
      console.log(`   Sample sections:`, sections.slice(0, 5));
    }
  } catch (err) {
    console.error(`[EXC] "${title}":`, err.message);
  }
}

async function run() {
  console.log('--- Inspecting Candidate Wiki Pages ---');
  await inspectPage('ध्रुवस्वामिनी');
  await inspectPage('नीलदेवी');
  await inspectPage('शिवशम्भु के चिट्ठे');
  await inspectPage('शिवशम्भु के चिट्ठे/७-बिदाई-सम्भाषण');
  await inspectPage('जयशंकर प्रसाद की श्रेष्ठ कहानियां/छोटा जादूगर');
  await inspectPage('जयशंकर प्रसाद की श्रेष्ठ कहानियां/ग्राम');
  await inspectPage('कबीर ग्रंथावली/(१) गुरुदेव कौ अंग');
  await inspectPage('कबीर ग्रंथावली/(२) सुमिरन कौ अंग');
  await inspectPage('परीक्षा गुरु');
  await inspectPage('प्रियप्रवास');
}

run();
