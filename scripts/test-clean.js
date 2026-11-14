import { cleanWikiHtml } from './fetch-wikisource.js';

function cleanChapter(raw) {
  let text = cleanWikiHtml(raw);
  // Strip top navigation lines containing (वर्ष) द्वारा or arrows
  text = text.replace(/^[^\n]*?(?:←|→|द्वारा|अनुप्रेषण)[^\n]*?\n+/gis, '');
  text = text.replace(/^[^\n]*?(?:मुखपृष्ठ|पहला दृश्य|प्रथम अङ्क|द्वितीय अङ्क|तृतीय अङ्क|चतुर्थ अङ्क|पंचम अङ्क)[^\n]*?(?:←|→)[^\n]*?\n+/gis, '');
  return text.trim();
}

console.log('cleanChapter function defined.');
