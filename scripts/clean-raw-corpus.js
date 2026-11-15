import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const RAW_DIR = path.resolve('content/raw');

function normalizeDevanagari(s) {
  return (s || '')
    .replace(/[^\u0900-\u097F]/g, '')
    .replace(/[।॥०-९\d]/g, '')
    .replace(/न्/g, 'ं')
    .replace(/म्/g, 'ं')
    .replace(/ङ्/g, 'ं')
    .replace(/ञ्/g, 'ं')
    .replace(/ण्/g, 'ं')
    .replace(/ी/g, 'ि')
    .replace(/ू/g, 'ु');
}

export function cleanHtmlEntitiesAndArtifacts(text) {
  if (!text) return '';
  return text
    // 1. Remove Word Joiner entity &#8288; and invisible Unicode artifacts
    .replace(/&#8288;/g, '')
    .replace(/[\u2060\uFEFF]/g, '')
    // 2. Decode standard bracket / star / space numeric entities
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
    .replace(/&#42;/g, '*')
    .replace(/&#8195;/g, ' ')
    // 3. Decode any other numeric entities &#...; or hex entities &#x...;
    .replace(/&#(\d+);/g, (m, dec) => {
      const code = parseInt(dec, 10);
      if (code === 8288 || code === 8203 || code === 65279) return '';
      if (code === 8195 || code === 8194 || code === 160) return ' ';
      return String.fromCharCode(code);
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (m, hex) => {
      const code = parseInt(hex, 16);
      if (code === 0x2060 || code === 0x200B || code === 0xFEFF) return '';
      if (code === 0x2003 || code === 0x2002 || code === 0x00A0) return ' ';
      return String.fromCharCode(code);
    })
    // 4. Strip wikitext tags
    .replace(/<\/?(?:poem|noinclude|ref|reg|br|ब्र)[\s\S]*?>/gi, '');
}

export function cleanBookContent(rawFileContent) {
  const { data: frontmatter, content } = matter(rawFileContent);
  const isPoetry = frontmatter.category === 'कविता';
  const bookTitle = frontmatter.title || '';
  const author = frontmatter.author || '';
  const normTitle = normalizeDevanagari(bookTitle);
  const normAuthor = normalizeDevanagari(author);

  const cleanContent = cleanHtmlEntitiesAndArtifacts(content);
  const rawChapters = cleanContent.split(/\n(?=# )/).filter(c => c.trim().length > 0);
  const cleanedChapters = [];

  for (const rawCh of rawChapters) {
    const trimmedRaw = rawCh.trim();
    if (!trimmedRaw.startsWith('# ')) {
      continue;
    }

    const firstNl = trimmedRaw.indexOf('\n');
    const header = firstNl === -1 ? trimmedRaw : trimmedRaw.slice(0, firstNl).trim();
    let body = firstNl === -1 ? '' : trimmedRaw.slice(firstNl).trim();

    const chTitle = header.replace(/^#\s*/, '').trim();
    const normChTitle = normalizeDevanagari(chTitle);

    // 1. Remove Wikisource disclaimer / license footer at end of chapter
    body = body.replace(/(?:पर सभी दस्तावेज सार्वजनिक प्रभावक्षेत्र|यह कार्य\s+भारत में\s+सार्वजनिक डोमेन|सार्वजनिक प्रभावक्षेत्र में आया था|कॉपीराइट पंजीकरण नहीं है|This work is in the|Public domain)[\s\S]*$/gi, '');

    // 2. Identify and strip top navigation & title repeat lines line-by-line
    const lines = body.split('\n');
    let topCleanIdx = 0;

    // Lookahead: nav header within first 14 lines
    const firstNonEmpty = [];
    for (let i = 0; i < Math.min(lines.length, 16); i++) {
      const trimmed = lines[i].trim();
      if (trimmed) firstNonEmpty.push({ lineIndex: i, text: trimmed });
    }

    const navMatch = firstNonEmpty.find(item =>
      item.lineIndex <= 8 &&
      item.text.length < 160 &&
      (
        item.text.includes('द्वारा') ||
        item.text.includes('→') ||
        item.text.includes('←') ||
        item.text.includes('अगला अध्याय') ||
        item.text.includes('पिछला अध्याय') ||
        /\(\s*(?:18\d\d|19\d\d|20\d\d)\s*\)/.test(item.text)
      )
    );

    if (navMatch) {
      const allBeforeAreShort = firstNonEmpty
        .filter(item => item.lineIndex < navMatch.lineIndex)
        .every(item => item.text.length < 120);
      
      if (allBeforeAreShort) {
        topCleanIdx = navMatch.lineIndex + 1;
      }
    }

    let prevWasRole = false;

    while (topCleanIdx < lines.length) {
      const rawLine = lines[topCleanIdx].trim();
      if (!rawLine) {
        topCleanIdx++;
        continue;
      }

      const normLine = normalizeDevanagari(rawLine);

      const isNav =
        rawLine.includes('द्वारा') ||
        rawLine.includes('अनुवादक') ||
        rawLine.includes('संपादक') ||
        rawLine.includes('←') ||
        rawLine.includes('→') ||
        rawLine.includes('⇐') ||
        rawLine.includes('⇒') ||
        /\(\s*(?:18\d\d|19\d\d|20\d\d)\s*\)/.test(rawLine) ||
        rawLine.includes('यह निर्माणाधीन पुस्तक है') ||
        rawLine.includes('इसकी वर्तनी जाँच') ||
        /^(?:पीछे|आगे|अगला|पिछला|मुखपृष्ठ|मुख्यपृष्ठ|अनुक्रमणिका|विषय-सूची|विषय सूची|प्राक्कथन|प्रवेश|भूमिका)(?:\s|[—–\-]|$)/.test(rawLine) ||
        /^(?:अगला अध्याय|पिछला अध्याय|पहला भाग|विषय-सूची|मुखपृष्ठ|मुख्य पृष्ठ)/.test(rawLine);

      const isWikiTag = /^(?:Layout\s*\d+|TEXT|HEADER|FOOTER|smallblock|nop|center|right|left)$/i.test(rawLine);
      const isPublisherSeries = /^(?:नागरीप्रचारिणी ग्रंथमाला|नागरीप्रचारिणी सभा|ग्रंथमाला|पुस्तकमाला)/.test(rawLine);
      const isGenreTag = rawLine.length < 35 && /^(?:आलोचना व निबन्ध|आलोचना|निबन्ध|निबंध|उपन्यास|कहानी|नाटक|कविता|काव्य|जीवनी|इतिहास|प्रहसन|एकांकी|समीक्षा|साहित्यिक निबंध)(?:[।\s]|$)/.test(rawLine);
      const isBylineOrRole = /^(?:.+ लिखित|.+ विरचित|.+ कृत|संपादक|प्रकाशक|अनुवादक)$/.test(rawLine);
      const isNameAfterRole = prevWasRole && rawLine.length < 50;
      const isYearOrEra = /^(?:18\d\d|19\d\d|20\d\d|संवत्\s*[०-९\d]+)$/.test(rawLine);

      const isDecorative = /^[\s—–\-_:○*•·|~=]+$/.test(rawLine);
      const isPageNum = /^\(?\[?\s*[०-९\d]+\s*\]?\)?\.?$/.test(rawLine);

      const isShort = rawLine.length < 120;
      const isTitleRepeat = isShort && normLine.length >= 2 && (
        normLine === normTitle ||
        (normLine.length >= 3 && normTitle.includes(normLine)) ||
        (normTitle.length >= 3 && normLine.includes(normTitle))
      );

      const isAuthorRepeat = isShort && normLine.length >= 2 && (
        normLine === normAuthor ||
        (normLine.length >= 3 && normAuthor.includes(normLine))
      );

      const isChTitleRepeat = isShort && normLine.length >= 2 && (
        normLine === normChTitle ||
        (normLine.length >= 3 && normChTitle.includes(normLine)) ||
        (normChTitle.length >= 3 && normLine.includes(normChTitle))
      );

      const isStructuralLabel = isShort && (
        /^(?:पहला|दूसरा|तीसरा|चौथा|पांचवां|छठा|सातवां|आठवां|नौवां|दसवां|पहिला|प्रथम|द्वितीय|तृतीय|चतुर्थ|पंचम)\s+(?:भाग|हिस्सा|अध्याय|बयान|प्रकरण|परिच्छेद|सर्ग|दृश्य|अंक|खंड|खण्ड|प्रकाश)/.test(rawLine) ||
        /^(?:भाग|अध्याय|बयान|प्रकरण|परिच्छेद|सर्ग|दृश्य|अंक|खंड|खण्ड)\s*[०-९\d]+[।\s\.\-–—]*$/.test(rawLine) ||
        /^(?:एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस)[।\s\.\-–—]*$/.test(rawLine) ||
        /^परिच्छेद\s*[०-९\d]+[।\s]*$/.test(rawLine) ||
        /^प्रकरण[―\-\s]*[०-९\d]+[।\s]*$/.test(rawLine) ||
        /^[०-९\d]+\.?$/.test(rawLine)
      );

      const isSubpageHeader = isShort && !isPoetry && rawLine.length < 40 && !/[।॥?!,:\.\"\']/.test(rawLine) && !rawLine.startsWith('#');

      if (isNav || isWikiTag || isPublisherSeries || isGenreTag || isBylineOrRole || isNameAfterRole || isYearOrEra || isDecorative || isPageNum || isTitleRepeat || isAuthorRepeat || isChTitleRepeat || isStructuralLabel || isSubpageHeader) {
        prevWasRole = /^(?:संपादक|प्रकाशक|अनुवादक)$/.test(rawLine);
        topCleanIdx++;
      } else {
        break;
      }
    }

    body = lines.slice(topCleanIdx).join('\n').trim();

    // 3. Clean intermediate DjVu scan page breaks & running headers
    const pageBreakRegex = /[\t ]*[\uFEFF\u2060\u200B-\u200D]?_{3,}[\t ]*\n+(?:[\t ]*(?:\([०-९\d]+\)|\[[०-९\d]+\]|[०-९\d]+|[^\n]{1,60})\n+)*/g;
    body = body.replace(pageBreakRegex, '\n\n__PAGE_BREAK__\n\n');
    body = body.replace(/\n+[\t ]*(?:\([०-९\d]+\)|\[[०-९\d]+\]|&#91;\s*[०-९\d]+\s*&#93;)[\t ]*\n+/g, '\n\n__PAGE_BREAK__\n\n');

    // Stitch text across __PAGE_BREAK__
    const pbParts = body.split('__PAGE_BREAK__');
    let stitchedBody = pbParts[0].trim();

    // Construct flexible regex for title prefix to strip running headers from nextPart
    const cleanTitle = (frontmatter.title || '')
      .replace(/[^\u0900-\u097F\s]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
    const titleWords = cleanTitle.split(' ').filter(w => w.length >= 2);
    let titlePattern = null;
    if (titleWords.length > 0) {
      const patternStr = '^(?:\\([\\s०-९\\d]+\\)|\\[[\\s०-९\\d]+\\]|[\\s०-९\\d]+)?\\s*(?:' + titleWords.map(w => {
        return w
          .replace(/ंद्र/g, '(?:ंद्र|न्द्र)')
          .replace(/ंत/g, '(?:ंत|न्त)')
          .replace(/ंप/g, '(?:ंप|म्प)')
          .replace(/ंब/g, '(?:ंब|म्ब)');
      }).join('\\s*') + ')\\s*';
      try {
        titlePattern = new RegExp(patternStr, 'u');
      } catch (e) {
        titlePattern = null;
      }
    }

    for (let pIdx = 1; pIdx < pbParts.length; pIdx++) {
      let cleanNextPart = pbParts[pIdx].trim();
      if (!cleanNextPart) continue;

      // Strip running headers or standalone numbers from start of cleanNextPart (even if on same line)
      let strippedPrefix = true;
      while (strippedPrefix) {
        strippedPrefix = false;
        // Page number prefix: (२) or [२]
        const pNumMatch = cleanNextPart.match(/^(?:\([\s०-९\d]+\)|\[[\s०-९\d]+\])\s*/);
        if (pNumMatch) {
          cleanNextPart = cleanNextPart.slice(pNumMatch[0].length).trim();
          strippedPrefix = true;
        }
        // Structural label prefix (e.g. "पहिला हिस्सा ", "पहला भाग ")
        const structMatch = cleanNextPart.match(/^(?:पहला|पहिला|दूसरा|तीसरा|चौथा|पांचवां)\s+(?:भाग|हिस्सा|खंड|खण्ड|अध्याय|बयान|प्रकरण|परिच्छेद)\s*/);
        if (structMatch) {
          cleanNextPart = cleanNextPart.slice(structMatch[0].length).trim();
          strippedPrefix = true;
        }
        // Title prefix if it matches start of cleanNextPart
        if (titlePattern && titlePattern.test(cleanNextPart)) {
          cleanNextPart = cleanNextPart.replace(titlePattern, '').trim();
          strippedPrefix = true;
        }
        // Strip leading pipes from OCR: e.g. "| का नाम..."
        if (cleanNextPart.startsWith('|')) {
          cleanNextPart = cleanNextPart.replace(/^\|\s*/, '').trim();
          strippedPrefix = true;
        }
      }

      if (!cleanNextPart) continue;

      const prevEndsTerminal = /[।॥?!;:\.\"'”’\]\)]\s*$/.test(stitchedBody);
      const nextStartsWithConnector = /^(?:ने|को|से|का|की|के|में|पर|और|या|किंतु|परंतु|तथा|एवं|भी|ही|तो|कि)\b/.test(cleanNextPart);

      if (!prevEndsTerminal || nextStartsWithConnector) {
        stitchedBody = stitchedBody + ' ' + cleanNextPart;
      } else {
        stitchedBody = stitchedBody + '\n\n' + cleanNextPart;
      }
    }

    // 4. Paragraph processing
    const rawParagraphs = stitchedBody.split(/\n\s*\n+/);
    const processedParagraphs = [];

    for (const p of rawParagraphs) {
      const trimmedP = p.trim();
      if (!trimmedP) continue;

      if (trimmedP.startsWith('#') || trimmedP.startsWith('>')) {
        processedParagraphs.push(trimmedP);
      } else if (isPoetry) {
        // Poetry: clean stray indentation on verse lines
        const cleanStanza = trimmedP
          .split('\n')
          .map(l => l.replace(/^[ \t]+/, '').trim())
          .filter(Boolean)
          .join('\n');
        processedParagraphs.push(cleanStanza);
      } else {
        // Prose: join soft-wrapped lines into a single coherent paragraph
        const singleP = trimmedP
          .split('\n')
          .map(l => l.trim())
          .filter(Boolean)
          .join(' ')
          .replace(/[ \t]{2,}/g, ' ');
        processedParagraphs.push(singleP);
      }
    }

    cleanedChapters.push(header + '\n\n' + processedParagraphs.join('\n\n'));
  }

  const frontmatterStr = matter.stringify('', frontmatter).trim();
  return frontmatterStr + '\n\n' + cleanedChapters.join('\n\n') + '\n';
}

function main() {
  const files = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.md'));
  console.log(`[CLEANER] Starting corpus cleanup for ${files.length} books...`);

  let count = 0;
  for (const file of files) {
    const filePath = path.join(RAW_DIR, file);
    const raw = fs.readFileSync(filePath, 'utf8');
    const cleaned = cleanBookContent(raw);
    fs.writeFileSync(filePath, cleaned, 'utf8');
    count++;
  }

  console.log(`[CLEANER] Successfully cleaned and overwritten ${count} files in content/raw/`);
}

if (process.argv[1] && process.argv[1].endsWith('clean-raw-corpus.js')) {
  main();
}
