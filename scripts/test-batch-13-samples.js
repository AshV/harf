import { fetchWikiPage, cleanWikiHtml } from './fetch-wikisource.js';

async function checkSample(title) {
  try {
    const raw = await fetchWikiPage(title);
    const clean = cleanWikiHtml(raw);
    const wordCount = clean.split(/\s+/).filter(Boolean).length;
    console.log(`[OK] ${title} => ${clean.length} chars, ~${wordCount} words`);
    console.log(`     Sample: ${clean.substring(0, 150).replace(/\n/g, ' ')}...`);
    return { title, length: clean.length, words: wordCount, ok: clean.length > 100 };
  } catch (err) {
    console.error(`[ERR] ${title}: ${err.message}`);
    return { title, error: err.message, ok: false };
  }
}

async function main() {
  console.log('--- TESTING CHATURSEN SHASTRI: कहानी खत्म हो गई ---');
  await checkSample('कहानी खत्म हो गई/कहानी खत्म हो गई');
  await checkSample('कहानी खत्म हो गई/ककड़ी की कीमत');
  await checkSample('कहानी खत्म हो गई/वासवदत्ता');

  console.log('\n--- TESTING PRASAD: आँधी ---');
  await checkSample('आँधी/१-आंधी');
  await checkSample('आँधी/२-मधुआ');
  await checkSample('आँधी/१०-नीरा');

  console.log('\n--- TESTING PREMCHAND: कर्बला ---');
  await checkSample('कर्बला/नाटक का कथानक');
  await checkSample('कर्बला/पहला अंक');
  await checkSample('कर्बला/चौथा अंक');

  console.log('\n--- TESTING PREMCHAND: संग्राम ---');
  await checkSample('संग्राम/१.१');
  await checkSample('संग्राम/३.१');
  await checkSample('संग्राम/५.६');

  console.log('\n--- TESTING HARIAUDH: चोखे चौपदे ---');
  await checkSample('चोखे चौपदे/मुखपृष्ठ');
  await checkSample('चोखे चौपदे/ केसर की क्यारी');
  await checkSample('चोखे चौपदे/अनमोल हीरे');
}

main().catch(console.error);
