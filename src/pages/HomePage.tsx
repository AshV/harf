import React, { useState, useEffect } from 'react';
import type { BookSummary } from '../types';
import { Header } from '../components/common/Header';
import { SearchModal } from '../components/search/SearchModal';
import { BookCard } from '../components/library/BookCard';
import { HeroContinueCard } from '../components/library/HeroContinueCard';
import { FeaturedSpotlight } from '../components/library/FeaturedSpotlight';
import { DailyQuoteCard } from '../components/library/DailyQuoteCard';
import { useAllReadingProgress } from '../hooks/useReadingProgress';
import { getStorageUsage, requestPersistentStorage } from '../utils/storage';
import { db } from '../db';
import { Feather, Compass, Sparkles } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('सभी');
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

  // Choose a spotlight book (e.g. Idgah or first book)
  const spotlightBook = books.find((b) => b.id === 'idgah') || books[0];

  // Filters calculation
  const filterOptions = [
    { id: 'सभी', label: 'सभी कृतियाँ', count: books.length },
    { id: 'ऑफ़लाइन', label: 'ऑफ़लाइन सहेजी गई', count: offlineBookIds.size }
  ];

  const filteredBooks = books.filter((b) => {
    if (selectedFilter === 'सभी') return true;
    if (selectedFilter === 'ऑफ़लाइन') return offlineBookIds.has(b.id);
    return b.category === selectedFilter;
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1916] selection:bg-[#E08E45]/30">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        storageUsage={storageUsage}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Continue Reading Hero (Shown if user has active reading session) */}
        {continueBook && lastReadProgress && (
          <HeroContinueCard book={continueBook} progress={lastReadProgress} />
        )}

        {/* Featured Masterpiece Spotlight (Hero of the Day) */}
        {spotlightBook && (!continueBook || spotlightBook.id !== continueBook.id) && (
          <FeaturedSpotlight book={spotlightBook} />
        )}

        {/* Daily Literary Quote */}
        <DailyQuoteCard />

        {/* Curated Collection Section */}
        <section className="mt-8 mb-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#C85A32] uppercase tracking-wider mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>पुस्तकालय संग्रह</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#1F1916] tracking-tight">
                कालजयी कृतियाँ (Timeless Classics)
              </h2>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {filterOptions.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
                    selectedFilter === f.id
                      ? 'bg-[#231814] text-[#FAF5E8] shadow-md'
                      : 'bg-white hover:bg-white/80 text-[#1F1916]/75 border border-[#231A15]/10 shadow-2xs'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedFilter === f.id
                        ? 'bg-white/20 text-white'
                        : 'bg-black/5 text-black/60'
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Books Grid with 3D Tactile Presentation */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6 animate-pulse">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="aspect-[2/3] rounded-2xl bg-black/5" />
              ))}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 sm:gap-8">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  isOffline={offlineBookIds.has(book.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white/60 rounded-3xl border border-[#231A15]/10 p-6">
              <Feather className="w-10 h-10 mx-auto text-[#1F1916]/30 mb-3" />
              <h3 className="font-bold text-base text-[#1F1916] mb-1">
                कोई पुस्तक नहीं मिली
              </h3>
              <p className="text-xs text-[#1F1916]/60">
                इस श्रेणी में अभी कोई पुस्तक उपलब्ध नहीं है।
              </p>
            </div>
          )}
        </section>

        {/* Great Literary Masters Section */}
        <section className="mt-12 pt-10 border-t border-[#231A15]/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#C85A32]" />
            <h3 className="font-bold text-lg font-serif text-[#1F1916]">
              साहित्य के कालजयी स्तंभ
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#7D2E1E] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm">
                प्र
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1F1916]">मुंशी प्रेमचंद</h4>
                <p className="text-xs text-[#C85A32] font-semibold">उपन्यास सम्राट (१८८० – १९३६)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  गोदान, कफ़न, ईदगाह, पंच परमेश्वर, सेवासदन
                </p>
              </div>
            </div>

            <div className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs transition-all flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#1B2A4A] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm">
                प्र
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#1F1916]">जयशंकर प्रसाद</h4>
                <p className="text-xs text-[#1B2A4A] font-semibold">छायावाद के प्रवर्तक (१८८९ – १९३७)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  कामायनी, चंद्रगुप्त, ध्रुवस्वामिनी, आँसू
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Literary Footer */}
      <footer className="mt-16 py-8 border-t border-[#231A15]/10 bg-white/40 text-center text-xs text-[#1F1916]/60">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <p className="font-serif font-medium text-[#1F1916]/80">
            हर्फ़ (Harf) — भारतीय साहित्य की अमूल्य धरोहर को सुरुचिपूर्ण और आधुनिक रूप में सहेजने का प्रयास।
          </p>
          <p className="text-[11px] opacity-70">
            सभी प्रस्तुत कृतियाँ सार्वजनिक डोमेन (Public Domain) में हैं • 100% नि:शुल्क एवं ऑफ़लाइन समर्थित
          </p>
        </div>
      </footer>

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        books={books}
      />
    </div>
  );
};
