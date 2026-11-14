import Dexie, { type Table, type EntityTable } from 'dexie';
import type { BookMetadata, ChapterContent, ReadingProgress, Bookmark, Highlight } from '../types';

export class HarfDatabase extends Dexie {
  books!: EntityTable<BookMetadata, 'id'>;
  chapters!: Table<ChapterContent>;
  progress!: EntityTable<ReadingProgress, 'book_id'>;
  bookmarks!: EntityTable<Bookmark, 'id'>;
  highlights!: EntityTable<Highlight, 'id'>;

  constructor() {
    super('HarfDB');
    this.version(1).stores({
      books: 'id, title, author, category, *keywords',
      chapters: '[book_id+chapter_id], book_id',
      progress: 'book_id, last_read_timestamp',
      bookmarks: '++id, book_id, chapter_id, block_id, created_at'
    });

    this.version(2).stores({
      highlights: '++id, book_id, chapter_id, block_id, created_at'
    });
  }
}

export const db = new HarfDatabase();
