import fs from 'fs';
import path from 'path';

const RAW_FILE = path.resolve('content/raw/sapta-saroj.md');

async function fetchGrehlakshmiSaut() {
  const url = 'https://grehlakshmi.com/hindi-kahani/premchand-story/saut';
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  // Find start of missing text
  const startMarker = 'दैवयोग से इन्हीं दिनों गोमती बीमार';
  const endMarker = 'पर क्या वे उसके विलाप के आंसू थे?';

  const startIdx = html.indexOf(startMarker);
  const endIdx = html.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    throw new Error('Could not find start or end marker in Grehlakshmi page');
  }

  const rawMissing = html.slice(startIdx, endIdx + endMarker.length);
  // Clean html
  let cleanMissing = rawMissing
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&zwj;/g, '')
    .replace(/&zwnj;/g, '')
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleanMissing;
}

export async function repairSaptaSaroj() {
  console.log('Repairing सप्तसरोज (सौत कहानी पूर्णता)...');

  const missingText = await fetchGrehlakshmiSaut();
  console.log('Fetched missing Saut text length:', missingText.length);

  const content = fs.readFileSync(RAW_FILE, 'utf-8');
  const chapters = content.split(/\n(?=# )/);

  // Chapter 8 is Saut
  let saut = chapters[8];

  // Remove the cut-off fragment and wikipedia navbox
  // Pattern around the cutoff: 'वह निरा स्वार्थ'
  const cutoffIdx = saut.indexOf('वह निरा स्वार्थ');
  if (cutoffIdx === -1) {
    throw new Error('Cutoff marker not found in chapter 8 of sapta-saroj');
  }

  // Slice up to before 'वह निरा स्वार्थ'
  const intactPart = saut.slice(0, cutoffIdx).trim();

  // Reassemble Saut cleanly
  const repairedSaut = intactPart + ' वह निरा स्वार्थ था।\n\n' + missingText + '\n';
  chapters[8] = repairedSaut;

  const assembled = chapters.join('\n\n').trim() + '\n';
  fs.writeFileSync(RAW_FILE, assembled, 'utf-8');
  console.log(`Successfully repaired ${RAW_FILE}! Total size: ${assembled.length} characters.`);
}

if (process.argv[1] && process.argv[1].endsWith('repair-sapta-saroj.js')) {
  repairSaptaSaroj();
}
