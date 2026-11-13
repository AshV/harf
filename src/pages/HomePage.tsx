import React, { useState, useEffect } from 'react';
import type { BookSummary } from '../types';
import { Header } from '../components/common/Header';
import { SearchModal } from '../components/search/SearchModal';
import { BookCard } from '../components/library/BookCard';
import { HeroContinueCard } from '../components/library/HeroContinueCard';
import { useAllReadingProgress } from '../hooks/useReadingProgress';
import { getStorageUsage, requestPersistentStorage } from '../utils/storage';
import { db } from '../db';

export const HomePage: React.FC = () => {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('सभी');
  const [storageUsage, setStorageUsage] = useState<{ usedMB: number } | null>(null);
  const [offlineBookIds, setOfflineBookIds] = useState<Set<string>>(new Set());

  const allProgress = useAllReadingProgress();

  useEffect(() => {
    // Request persistent storage on initial launch
    requestPersistentStorage();
    getStorageUsage().then(setStorageUsage);

    // Fetch library catalog
    fetch('./content/library.json')
      .then((res) => res.json())
      .then((data: BookSummary[]) => {
        setBooks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load library:', err);
        setLoading(false);
      });

    // Check which books are offline in IndexedDB
    async function checkOffline() {
      const cached = await db.books.toArray();
      setOfflineBookIds(new Set(cached.map((b) => b.id)));
    }
    checkOffline();
  }, []);

  // Find the most recently read book for the hero continue card
  const lastReadProgress = allProgress.sort(
    (a, b) => b.last_read_timestamp - a.last_read_timestamp
  )[0];
  const continueBook = lastReadProgress
    ? books.find((b) => b.id === lastReadProgress.book_id)
    : null;

  // Categories extraction
  const categories = ['सभी', 'ऑफ़लाइन', ...Array.from(new Set(books.map((b) => b.category)))];

  const filteredBooks = books.filter((b) => {
    if (selectedCategory === 'सभी') return true;
    if (selectedCategory === 'ऑफ़लाइन') return offlineBookIds.has(b.id);
    return b.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#FBF0D9] text-[#2C221E]">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        storageUsage={storageUsage}
      />

      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Continue Reading Hero Card */}
        {continueBook && lastReadProgress && (
          <HeroContinueCard book={continueBook} progress={lastReadProgress} />
        )}

        {/* Section Heading & Category Filter Pills */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold font-serif">
              पुस्तकालय (Collection)
            </h2>
            <span className="text-xs text-[#2C221E]/60 font-medium">
              {filteredBooks.length} पुस्तकें
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                  selectedCategory === cat
                    ? 'bg-[#2C221E] text-[#FBF0D9] shadow-sm'
                    : 'bg-white/60 hover:bg-white text-[#2C221E]/80 border border-[#2C221E]/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Books Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-64 rounded-2xl bg-[#2C221E]/10" />
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                isOffline={offlineBookIds.has(book.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white/40 rounded-3xl border border-[#2C221E]/10">
            <p className="text-sm text-[#2C221E]/60">
              इस श्रेणी में कोई पुस्तक उपलब्ध नहीं है।
            </p>
          </div>
        )}
      </main>

      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        books={books}
      />
    </div>
  );
};

