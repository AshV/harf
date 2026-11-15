import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const RAW_DIR = path.resolve('content/raw');

function normalizeDevanagari(s) {
  return (s || '')
    .replace(/[^\u0900-\u097F]/g, '')
    .replace(/[।॥०-९\d]/g, '');
}

function auditBook(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const { data: meta, content: body } = matter(content);

  const chapters = body.split(/\n(?=# )/).filter((c) => c.trim().length > 0);
  const words = body
    .replace(/[।.,?!;:"()\[\]{}—–-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const lastLine = lines.length > 0 ? lines[lines.length - 1] : '';
  const secondLastLine = lines.length > 1 ? lines[lines.length - 2] : '';
  const tailText = `${secondLastLine} ${lastLine}`.trim();

  // Permissible conclusion endings: Hindi danda, double danda, quotes, brackets, or conclusion words
  const validPunctuation = /[।॥!?."\x27)\]»”’]$/;
  const validConclusionWords = /(?:समाप्त|इति|शुभम्|पटाक्षेप|परिशिष्ट|विश्राम|यवनिका|अन्त|छाप|प्रेस|कुटीर|सभा|बनारस|इलाहाबाद|आगरा|१९\d\d|18\d\d|19\d\d|20\d\d|[०-९]+|\-|\*)$/i;

  const hasPunctuation = validPunctuation.test(lastLine);
  const hasConclusionWord = validConclusionWords.test(lastLine);
  const isAbruptCutoff = !hasPunctuation && !hasConclusionWord;

  const issues = [];

  // Check 1: Critical Truncation based on Genre
  if (meta.category === 'उपन्यास') {
    if (words < 5000) {
      issues.push({ severity: 'CRITICAL', msg: `उपन्यास के लिए अत्यधिक कम शब्द (${words} शब्द, अपेक्षित > 15,000)` });
    } else if (words < 12000) {
      issues.push({ severity: 'WARNING', msg: `लघु उपन्यास या खण्डित होने का संदेह (${words} शब्द)` });
    }
  } else if (meta.category === 'नाटक') {
    if (words < 2500) {
      issues.push({ severity: 'CRITICAL', msg: `नाटक के लिए अत्यधिक कम शब्द (${words} शब्द, अपेक्षित > 6,000)` });
    }
  } else if (meta.category === 'कहानी' && chapters.length > 5 && words < 4000) {
    issues.push({ severity: 'WARNING', msg: `बहु-अध्यायी कहानी संग्रह के लिए कम शब्द (${words} शब्द)` });
  }

  // Check 2: Mid-sentence cutoff
  if (isAbruptCutoff && lastLine.length > 15) {
    issues.push({
      severity: 'WARNING',
      msg: `अंतिम वाक्य अधूरा प्रतीत होता है: "...${lastLine.slice(-40)}"`
    });
  }

  // Check 3: Empty chapters
  let emptyChapters = 0;
  chapters.forEach((ch, idx) => {
    const chLines = ch.trim().split('\n');
    const chBody = chLines.slice(1).join(' ').trim();
    if (chBody.length < 10) emptyChapters++;
  });
  if (emptyChapters > 0) {
    issues.push({ severity: 'WARNING', msg: `${emptyChapters} अध्याय रिक्त या लगभग खाली हैं` });
  }

  return {
    id: meta.id || path.basename(filePath, '.md'),
    title: meta.title || 'Unknown',
    author: meta.author || 'Unknown',
    category: meta.category || 'General',
    chapters: chapters.length,
    words,
    issues,
    lastLineTail: lastLine.slice(-50)
  };
}

export function runCorpusAudit() {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.md'));
  console.log('====================================================');
  console.log(`HARF CORPUS INTEGRITY AUDIT: ${files.length} BOOKS`);
  console.log('====================================================\n');

  const results = [];
  const critical = [];
  const warnings = [];

  for (const f of files) {
    const res = auditBook(path.join(RAW_DIR, f));
    results.push(res);
    const crits = res.issues.filter((i) => i.severity === 'CRITICAL');
    const warns = res.issues.filter((i) => i.severity === 'WARNING');
    if (crits.length > 0) critical.push({ book: res, crits });
    if (warns.length > 0) warnings.push({ book: res, warns });
  }

  console.log(`Total Books Audited: ${results.length}`);
  console.log(`✓ 100% Intact Books: ${results.length - critical.length - warnings.length}`);
  console.log(`⚠ Books with Minor Warnings: ${warnings.length}`);
  console.log(`✗ Books with Critical Issues: ${critical.length}\n`);

  if (critical.length > 0) {
    console.log('--- [CRITICAL ISSUES] ---');
    critical.forEach(({ book, crits }) => {
      console.log(`[${book.id}] ${book.title} (${book.author}) | ${book.category}`);
      crits.forEach((c) => console.log(`   ✗ ${c.msg}`));
    });
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('--- [WARNINGS & SUSPICIOUS CUTOFFS] ---');
    warnings.forEach(({ book, warns }) => {
      console.log(`[${book.id}] ${book.title} (${book.author}) | ${book.words} words | ${book.chapters} ch`);
      warns.forEach((w) => console.log(`   ⚠ ${w.msg}`));
    });
    console.log('');
  }

  // Summary Metrics
  const totalWords = results.reduce((acc, r) => acc + r.words, 0);
  const totalChapters = results.reduce((acc, r) => acc + r.chapters, 0);
  console.log('--- [OVERALL CORPUS METRICS] ---');
  console.log(`Total Words in Library: ${totalWords.toLocaleString()} words`);
  console.log(`Total Chapters across all Books: ${totalChapters.toLocaleString()} chapters`);
  console.log(`Average Book Length: ${Math.round(totalWords / results.length).toLocaleString()} words\n`);

  return { results, critical, warnings };
}

// Run if called directly
if (process.argv[1] && process.argv[1].endsWith('audit-corpus.js')) {
  runCorpusAudit();
}
