import { useState, useEffect } from 'react';
import { db } from '../db';
import type { BookMetadata, ChapterContent } from '../types';

export function useBook(bookId: string) {
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadBook() {
      setLoading(true);
      setError(null);

      try {
        // 1. Try local IndexedDB first
        const cached = await db.books.get(bookId);
        if (cached && isMounted) {
          setBook(cached);
          setLoading(false);
        }

        // 2. Fetch fresh metadata from network
        const res = await fetch(`./content/books/${bookId}/meta.json`);
        if (res.ok) {
          const fresh: BookMetadata = await res.json();
          if (isMounted) {
            setBook(fresh);
            setLoading(false);
          }
          await db.books.put(fresh);
        } else if (!cached) {
          throw new Error('पुस्तक की जानकारी प्राप्त नहीं हो सकी।');
        }
      } catch (err) {
        if (isMounted) {
          // If already set by cache, don't show error
          if (!book) {
            setError((err as Error).message || 'नेटवर्क त्रुटि');
          }
          setLoading(false);
        }
      }
    }

    loadBook();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  return { book, loading, error };
}

export function useChapter(bookId: string, chapterId: string) {
  const [chapter, setChapter] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadChapter() {
      setLoading(true);
      setError(null);

      try {
        // 1. Try local IndexedDB first
        const cached = await db.chapters.get([bookId, chapterId]);
        if (cached && isMounted) {
          setChapter(cached);
          setLoading(false);
          return;
        }

        // 2. Fetch from network
        const res = await fetch(`./content/books/${bookId}/${chapterId}.json`);
        if (res.ok) {
          const fresh: ChapterContent = await res.json();
          if (isMounted) {
            setChapter(fresh);
            setLoading(false);
          }
          // Cache in IndexedDB for subsequent reads
          await db.chapters.put(fresh);
        } else {
          throw new Error('अध्याय लोड करने में समस्या आई।');
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message || 'अध्याय उपलब्ध नहीं है।');
          setLoading(false);
        }
      }
    }

    loadChapter();

    return () => {
      isMounted = false;
    };
  }, [bookId, chapterId]);

  return { chapter, loading, error };
}
