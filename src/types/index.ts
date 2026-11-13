export interface ChapterSummary {
  id: string;
  number: number;
  title: string;
  block_count: number;
  word_count: number;
  estimated_minutes: number;
  file: string;
}

export interface BookMetadata {
  id: string;
  title: string;
  title_en: string;
  author: string;
  author_en: string;
  category: string;
  category_en: string;
  description: string;
  cover_image: string;
  published_year?: number;
  keywords: string[];
  total_words: number;
  total_chapters: number;
  estimated_reading_minutes: number;
  chapters: ChapterSummary[];
}

export interface BookSummary {
  id: string;
  title: string;
  title_en: string;
  author: string;
  author_en: string;
  category: string;
  category_en: string;
  description: string;
  cover_image: string;
  total_chapters: number;
  estimated_reading_minutes: number;
  keywords: string[];
}

export interface Block {
  id: string;
  type: 'p' | 'quote' | 'h1' | 'h2';
  text: string;
}

export interface ChapterContent {
  book_id: string;
  chapter_id: string;
  number: number;
  title: string;
  word_count: number;
  blocks: Block[];
}

export interface ReadingProgress {
  book_id: string;
  chapter_id: string;
  block_id: string;
  percentage: number;
  last_read_timestamp: number;
}

export interface Bookmark {
  id?: number;
  book_id: string;
  chapter_id: string;
  block_id: string;
  snippet: string;
  created_at: number;
}

export type ReaderTheme = 'parchment' | 'night' | 'day' | 'sage';
export type ReaderFont = 'serif' | 'sans';

export interface ReaderSettings {
  fontSize: number; // in px, e.g. 19
  theme: ReaderTheme;
  fontFamily: ReaderFont;
  lineHeight: number; // e.g. 1.85
}
