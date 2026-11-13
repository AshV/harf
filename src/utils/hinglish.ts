import type { BookSummary } from '../types';

// Simple phonetic normalization for Hinglish searches
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0900-\u097F]/gi, '') // keep alphanumeric and devanagari
    .normalize('NFC');
}

export function searchBooks(books: BookSummary[], query: string): BookSummary[] {
  const q = normalizeQuery(query);
  if (!q) return books;

  return books.filter((book) => {
    const titleHi = normalizeQuery(book.title);
    const titleEn = normalizeQuery(book.title_en);
    const authorHi = normalizeQuery(book.author);
    const authorEn = normalizeQuery(book.author_en);
    const categoryHi = normalizeQuery(book.category);
    const categoryEn = normalizeQuery(book.category_en);
    const keywords = (book.keywords || []).map(normalizeQuery);

    return (
      titleHi.includes(q) ||
      titleEn.includes(q) ||
      authorHi.includes(q) ||
      authorEn.includes(q) ||
      categoryHi.includes(q) ||
      categoryEn.includes(q) ||
      keywords.some((k) => k.includes(q))
    );
  });
}

