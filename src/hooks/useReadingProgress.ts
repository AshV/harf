import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { ReadingProgress } from '../types';

export function useReadingProgress(bookId?: string) {
  const progress = useLiveQuery(
    async () => {
      if (!bookId) return undefined;
      return await db.progress.get(bookId);
    },
    [bookId]
  );

  const saveProgress = async (
    targetBookId: string,
    chapterId: string,
    blockId: string,
    percentage: number
  ) => {
    try {
      const entry: ReadingProgress = {
        book_id: targetBookId,
        chapter_id: chapterId,
        block_id: blockId,
        percentage: Math.min(100, Math.max(0, Math.round(percentage))),
        last_read_timestamp: Date.now()
      };
      await db.progress.put(entry);
    } catch (e) {
      console.warn('Failed to save reading progress', e);
    }
  };

  return {
    progress,
    saveProgress
  };
}

export function useAllReadingProgress() {
  const allProgress = useLiveQuery(async () => {
    return await db.progress.toArray();
  }, []);

  return allProgress || [];
}

