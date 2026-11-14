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
  console.log('--- 1. SAPRE KAHANIYA ---');
  await checkSample('माधवराव सप्रे की कहानियाँ/एक टोकरी भर मिट्‌टी');
  await checkSample('माधवराव सप्रे की कहानियाँ/एक पथिक का स्वप्न');
  await checkSample('माधवराव सप्रे की कहानियाँ/सम्मान किसे कहते हैं?');

  console.log('\n--- 2. DEWANGANA ---');
  await checkSample('देवांगना/आमुख');
  await checkSample('देवांगना/वाराणसी');
  await checkSample('देवांगना/सुखानन्द का आगमन');

  console.log('\n--- 3. KUCH VICHAR ---');
  await checkSample('कुछ विचार/साहित्य का उद्देश्य');
  await checkSample('कुछ विचार/कहानी-कला (१)');
  await checkSample('कुछ विचार/उपन्यास');

  console.log('\n--- 4. BHARATENDU JIVAN CHARITRA ---');
  await checkSample('भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/1');
  await checkSample('भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/4');
  await checkSample('भारतेन्दु बाबू हरिश्चंद्र का जीवन चरित्र/7');

  console.log('\n--- 5. ANAND MATH ---');
  await checkSample('आनन्द मठ/कथा मुख');
  await checkSample('आनन्द मठ/पहला परिच्छेद');
  await checkSample('आनन्द मठ/2.1');
  await checkSample('आनन्द मठ/4.8');
}

main().catch(console.error);
