import { db } from '../db';
import type { BookMetadata, ChapterContent } from '../types';

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[STORAGE] Persistent storage granted: ${isPersisted}`);
      return isPersisted;
    } catch (e) {
      console.warn('[STORAGE] Failed to request persistent storage', e);
    }
  }
  return false;
}

export async function getStorageUsage(): Promise<{ usedMB: number; quotaMB: number } | null> {
  if (typeof window !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usedMB = estimate.usage ? Math.round(estimate.usage / (1024 * 1024)) : 0;
      const quotaMB = estimate.quota ? Math.round(estimate.quota / (1024 * 1024)) : 0;
      return { usedMB, quotaMB };
    } catch (e) {
      console.warn('[STORAGE] Failed to estimate storage', e);
    }
  }
  return null;
}

// Download a complete book into IndexedDB for 100% offline reading
export async function downloadBookOffline(
  bookId: string,
  onProgress?: (chapterIndex: number, totalChapters: number) => void
): Promise<boolean> {
  try {
    // 1. Fetch meta.json
    const metaRes = await fetch(`./content/books/${bookId}/meta.json`);
    if (!metaRes.ok) throw new Error('Failed to fetch book metadata');
    const meta: BookMetadata = await metaRes.json();

    await db.books.put(meta);

    // 2. Fetch each chapter and store
    for (let i = 0; i < meta.chapters.length; i++) {
      const ch = meta.chapters[i];
      const chRes = await fetch(`./${ch.file}`);
      if (!chRes.ok) throw new Error(`Failed to fetch chapter ${ch.id}`);
      const chContent: ChapterContent = await chRes.json();
      await db.chapters.put(chContent);

      if (onProgress) {
        onProgress(i + 1, meta.chapters.length);
      }
    }

    return true;
  } catch (err) {
    console.error(`[STORAGE] Error downloading book ${bookId} offline:`, err);
    return false;
  }
}

// Remove book chapters from IndexedDB
export async function removeBookOffline(bookId: string): Promise<void> {
  await db.chapters.where('book_id').equals(bookId).delete();
  await db.books.delete(bookId);
}

// Check if a book is fully stored offline
export async function isBookOffline(bookId: string, totalChapters: number): Promise<boolean> {
  const count = await db.chapters.where('book_id').equals(bookId).count();
  return count >= totalChapters && totalChapters > 0;
}
