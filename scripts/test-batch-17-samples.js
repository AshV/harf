import { fetchWikiPage, cleanWikiHtml } from './fetch-wikisource.js';

async function checkSample(title) {
  try {
    const raw = await fetchWikiPage(title);
    const clean = cleanWikiHtml(raw);
    const wordCount = clean.split(/\s+/).filter(Boolean).length;
    console.log(`[OK] ${title} => ${clean.length} chars, ~${wordCount} words`);
    console.log(`     Sample: ${clean.substring(0, 150).replace(/\n/g, ' ')}...`);
    return { title, length: clean.length, words: wordCount, ok: clean.length > 50 };
  } catch (err) {
    console.error(`[ERR] ${title}: ${err.message}`);
    return { title, error: err.message, ok: false };
  }
}

async function main() {
  console.log('--- 1. BALKRISHNA BHATT: सौ अजान और एक सुजान ---');
  await checkSample('सौ अजान और एक सुजान/१');
  await checkSample('सौ अजान और एक सुजान/१०');
  await checkSample('सौ अजान और एक सुजान/२३');

  console.log('\n--- 2. PRATAP NARAYAN MISHRA: प्रताप पीयूष ---');
  await checkSample('प्रताप पीयूष/धोखा');
  await checkSample('प्रताप पीयूष/दांत');
  await checkSample('प्रताप पीयूष/खुशामद');

  console.log('\n--- 3. PREMCHAND: मानसरोवर १ ---');
  await checkSample('मानसरोवर १/पूस की रात');
  await checkSample('मानसरोवर १/ठाकुर का कुआँ');
  await checkSample('मानसरोवर १/गुल्ली-डण्डा');

  console.log('\n--- 4. CHATURSEN SHASTRI: आग और धुआं ---');
  await checkSample('आग और धुआं/1');
  await checkSample('आग और धुआं/10');
  await checkSample('आग और धुआं/19');

  console.log('\n--- 5. DEVAKI NANDAN KHATRI: चन्द्रकांता सन्तति ३ ---');
  await checkSample('चन्द्रकांता सन्तति 3/9.1');
  await checkSample('चन्द्रकांता सन्तति 3/10.1');
  await checkSample('चन्द्रकांता सन्तति 3/12.9');
}

main().catch(console.error);
