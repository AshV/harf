import { cleanWikiHtml, fetchWikiPage } from './fetch-wikisource.js';

async function testFetchBatch12() {
  console.log('1. Testing Ek Ghoont...');
  const eg = await fetchWikiPage('एक घूँट');
  console.log('Ek Ghoont len:', cleanWikiHtml(eg).length);
  console.log('Preview:\n', cleanWikiHtml(eg).slice(0, 200));

  console.log('\n2. Testing Kavya Aur Kala...');
  const kk = await fetchWikiPage('काव्य और कला तथा अन्य निबन्ध/यथार्थवाद और छायावाद');
  console.log('Kavya aur Kala len:', cleanWikiHtml(kk).length);
  console.log('Preview:\n', cleanWikiHtml(kk).slice(0, 200));

  console.log('\n3. Testing Meri Aatmakahani...');
  const ma = await fetchWikiPage('मेरी आत्मकहानी/२ नागरी-प्रचारिणी सभा');
  console.log('Meri Aatmakahani len:', cleanWikiHtml(ma).length);
  console.log('Preview:\n', cleanWikiHtml(ma).slice(0, 200));

  console.log('\n4. Testing Paanch Phool (Mantra)...');
  const pf = await fetchWikiPage('पाँच फूल/\u2060मंत्र');
  console.log('Paanch Phool len:', cleanWikiHtml(pf).length);
  console.log('Preview:\n', cleanWikiHtml(pf).slice(0, 200));

  console.log('\n5. Testing Revatat...');
  const rt = await fetchWikiPage('रेवातट (पृथ्वीराज-रासो)/रेवातट समय');
  console.log('Revatat len:', cleanWikiHtml(rt).length);
  console.log('Preview:\n', cleanWikiHtml(rt).slice(0, 200));
}

testFetchBatch12().catch(console.error);
