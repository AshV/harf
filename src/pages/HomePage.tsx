import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
import { Feather, Compass, Sparkles, Filter, X, Check, HardDriveDownload } from 'lucide-react';

export const HomePage: React.FC = () => {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ usedMB: number } | null>(null);
  const [offlineBookIds, setOfflineBookIds] = useState<Set<string>>(new Set());

  const [searchParams, setSearchParams] = useSearchParams();
  const collectionRef = useRef<HTMLElement>(null);

  // Separate Filter Dimensions from URL params
  const selectedCategory = searchParams.get('category') || 'all';
  const selectedAuthor = searchParams.get('author') || 'all';
  const onlyOffline = searchParams.get('offline') === 'true';

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

  // Update URL search parameters
  const updateFilter = (key: 'category' | 'author' | 'offline', value: string | boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (key === 'offline') {
      if (value === true) newParams.set('offline', 'true');
      else newParams.delete('offline');
    } else {
      if (value === 'all' || !value) newParams.delete(key);
      else newParams.set(key, value as string);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Find the most recently read book for the hero continue card
  const lastReadProgress = allProgress.sort(
    (a, b) => b.last_read_timestamp - a.last_read_timestamp
  )[0];
  const continueBook = lastReadProgress
    ? books.find((b) => b.id === lastReadProgress.book_id)
    : null;

  // Choose a spotlight book
  const spotlightBook = books.find((b) => b.id === 'idgah') || books[0];

  // Distinct categories and authors extraction with counts
  const categories = Array.from(new Set(books.map((b) => b.category)));
  const authors = Array.from(new Set(books.map((b) => b.author)));

  // Multi-facet filtering logic: Category AND Author AND Offline
  const filteredBooks = books.filter((book) => {
    // 1. Availability filter
    if (onlyOffline && !offlineBookIds.has(book.id)) return false;

    // 2. Category / Genre filter
    if (selectedCategory !== 'all' && book.category !== selectedCategory) return false;

    // 3. Author filter
    if (selectedAuthor !== 'all' && book.author !== selectedAuthor) return false;

    return true;
  });

  const hasActiveFilters = selectedCategory !== 'all' || selectedAuthor !== 'all' || onlyOffline;

  const scrollToCollection = () => {
    if (collectionRef.current) {
      collectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1916] selection:bg-[#E08E45]/30">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        storageUsage={storageUsage}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Continue Reading Hero (Shown if user has active reading session) */}
        {continueBook && lastReadProgress && !hasActiveFilters && (
          <HeroContinueCard book={continueBook} progress={lastReadProgress} />
        )}

        {/* Featured Masterpiece Spotlight (Hero of the Day) */}
        {spotlightBook && !continueBook && !hasActiveFilters && (
          <FeaturedSpotlight book={spotlightBook} />
        )}

        {/* Daily Literary Quote (Only shown on default view to keep filtered view focused) */}
        {!hasActiveFilters && <DailyQuoteCard />}

        {/* Curated Collection Section */}
        <section ref={collectionRef} className="mt-6 mb-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#C85A32] uppercase tracking-wider mb-1">
                <Compass className="w-3.5 h-3.5" />
                <span>पुस्तकालय संग्रह</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#1F1916] tracking-tight">
                {selectedAuthor !== 'all' ? `${selectedAuthor} की कृतियाँ` : 'कालजयी कृतियाँ'}
                {selectedCategory !== 'all' && ` • ${selectedCategory}`}
              </h2>
              <p className="text-xs text-[#1F1916]/60 mt-0.5 font-medium">
                कुल {filteredBooks.length} पुस्तकें उपलब्ध
              </p>
            </div>

            {/* Offline toggle pill */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateFilter('offline', !onlyOffline)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  onlyOffline
                    ? 'bg-emerald-900 text-emerald-100 border-emerald-700 shadow-sm'
                    : 'bg-white hover:bg-white/80 text-[#1F1916]/75 border-[#231A15]/10 shadow-2xs'
                }`}
              >
                <HardDriveDownload className={`w-3.5 h-3.5 ${onlyOffline ? 'text-emerald-400' : 'opacity-60'}`} />
                <span>केवल ऑफ़लाइन ({offlineBookIds.size})</span>
                {onlyOffline && <Check className="w-3 h-3 text-emerald-400" />}
              </button>
            </div>
          </div>

          {/* DUAL FILTER CONTROLS: Category & Author Managed Separately */}
          <div className="bg-white/70 rounded-3xl p-4 sm:p-5 border border-[#231A15]/10 shadow-xs mb-8 space-y-4">
            {/* Filter Row 1: विधा (Category / Genre) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1F1916]/60 uppercase tracking-wider flex items-center gap-1">
                  <Filter className="w-3 h-3 text-[#C85A32]" />
                  <span>विधा के अनुसार (By Genre)</span>
                </span>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => updateFilter('category', 'all')}
                    className="text-[11px] font-semibold text-[#C85A32] hover:underline"
                  >
                    हटाएँ
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => updateFilter('category', 'all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                    selectedCategory === 'all'
                      ? 'bg-[#231814] text-[#FAF5E8] shadow-sm'
                      : 'bg-black/5 hover:bg-black/10 text-[#1F1916]/70'
                  }`}
                >
                  सभी विधाएँ ({books.length})
                </button>

                {categories.map((cat) => {
                  const count = books.filter((b) => b.category === cat).length;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => updateFilter('category', isSelected ? 'all' : cat)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#C85A32] text-white shadow-sm'
                          : 'bg-black/5 hover:bg-black/10 text-[#1F1916]/70'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-black/10 text-black/60'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Row 2: रचनाकार (Authors) */}
            <div className="pt-3 border-t border-[#231A15]/8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#1F1916]/60 uppercase tracking-wider flex items-center gap-1">
                  <Feather className="w-3 h-3 text-[#1B2A4A]" />
                  <span>रचनाकार के अनुसार (By Author)</span>
                </span>
                {selectedAuthor !== 'all' && (
                  <button
                    onClick={() => updateFilter('author', 'all')}
                    className="text-[11px] font-semibold text-[#1B2A4A] hover:underline"
                  >
                    हटाएँ
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => updateFilter('author', 'all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 ${
                    selectedAuthor === 'all'
                      ? 'bg-[#231814] text-[#FAF5E8] shadow-sm'
                      : 'bg-black/5 hover:bg-black/10 text-[#1F1916]/70'
                  }`}
                >
                  सभी रचनाकार ({books.length})
                </button>

                {authors.map((author) => {
                  const count = books.filter((b) => b.author === author).length;
                  const isSelected = selectedAuthor === author;
                  return (
                    <button
                      key={author}
                      onClick={() => updateFilter('author', isSelected ? 'all' : author)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-95 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#1B2A4A] text-white shadow-sm'
                          : 'bg-black/5 hover:bg-black/10 text-[#1F1916]/70'
                      }`}
                    >
                      <span>{author}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-black/10 text-black/60'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Filters Summary Pill Bar */}
            {hasActiveFilters && (
              <div className="pt-3 border-t border-[#231A15]/8 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[#1F1916]/60">सक्रिय फ़िल्टर:</span>
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#C85A32]/10 text-[#C85A32] font-bold">
                      विधा: {selectedCategory}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('category', 'all')} />
                    </span>
                  )}
                  {selectedAuthor !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#1B2A4A]/10 text-[#1B2A4A] font-bold">
                      लेखक: {selectedAuthor}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('author', 'all')} />
                    </span>
                  )}
                  {onlyOffline && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                      केवल ऑफ़लाइन
                      <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter('offline', false)} />
                    </span>
                  )}
                </div>

                <button
                  onClick={clearAllFilters}
                  className="text-xs font-bold text-[#C85A32] hover:underline cursor-pointer"
                >
                  सभी फ़िल्टर साफ़ करें (Clear All)
                </button>
              </div>
            )}
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
              <p className="text-xs text-[#1F1916]/60 mb-4">
                चुने गए फ़िल्टर के अनुसार कोई रचना उपलब्ध नहीं है।
              </p>
              <button
                onClick={clearAllFilters}
                className="px-4 py-2 rounded-xl bg-[#231814] text-[#FAF5E8] text-xs font-bold"
              >
                सभी फ़िल्टर साफ़ करें
              </button>
            </div>
          )}
        </section>

        {/* Great Literary Masters Section with 1-Click Filter Links */}
        <section className="mt-12 pt-10 border-t border-[#231A15]/10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#C85A32]" />
            <h3 className="font-bold text-lg font-serif text-[#1F1916]">
              साहित्य के कालजयी स्तंभ (लेखक संग्रह)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Munshi Premchand Card */}
            <div
              onClick={() => {
                updateFilter('author', 'मुंशी प्रेमचंद');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#7D2E1E] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                प्र
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#C85A32] transition-colors">
                    मुंशी प्रेमचंद
                  </h4>
                  <span className="text-[11px] font-bold text-[#C85A32] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'मुंशी प्रेमचंद').length} कृतियाँ →
                  </span>
                </div>
                <p className="text-xs text-[#C85A32] font-semibold">उपन्यास सम्राट (१८८० – १९३६)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  गोदान, कफ़न, ईदगाह, पंच परमेश्वर, बड़े भाई साहब
                </p>
              </div>
            </div>

            {/* Jaishankar Prasad Card */}
            <div
              onClick={() => {
                updateFilter('author', 'जयशंकर प्रसाद');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#1B2A4A] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                प्र
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#1B2A4A] transition-colors">
                    जयशंकर प्रसाद
                  </h4>
                  <span className="text-[11px] font-bold text-[#1B2A4A] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'जयशंकर प्रसाद').length} कृतियाँ →
                  </span>
                </div>
                <p className="text-xs text-[#1B2A4A] font-semibold">छायावाद के प्रवर्तक (१८८९ – १९३७)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  कामायनी, ममता, आँसू, चंद्रगुप्त
                </p>
              </div>
            </div>

            {/* Bharatendu Harishchandra Card */}
            <div
              onClick={() => {
                updateFilter('author', 'भारतेन्दु हरिश्चंद्र');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#4D1515] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                भा
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#C85A32] transition-colors">
                    भारतेन्दु हरिश्चंद्र
                  </h4>
                  <span className="text-[11px] font-bold text-[#C85A32] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'भारतेन्दु हरिश्चंद्र').length} कृतियाँ →
                  </span>
                </div>
                <p className="text-xs text-[#C85A32] font-semibold">आधुनिक हिन्दी के जनक (१८५० – १८८५)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  अंधेर नगरी, भारत दुर्दशा, सत्य हरिश्चंद्र
                </p>
              </div>
            </div>

            {/* Devaki Nandan Khatri Card */}
            <div
              onClick={() => {
                updateFilter('author', 'देवकीनंदन खत्री');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0C1A2B] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                दे
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#F3C969] transition-colors">
                    देवकीनंदन खत्री
                  </h4>
                  <span className="text-[11px] font-bold text-[#F3C969] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'देवकीनंदन खत्री').length} कृतियाँ →
                  </span>
                </div>
                <p className="text-xs text-[#0C1A2B] font-semibold">तिलिस्म व ऐयारी के जनक (१८६१ – १९१३)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  चंद्रकांता, चंद्रकांता संतति, भूतनाथ, नरेंद्र मोहिनी
                </p>
              </div>
            </div>

            {/* Suryakant Tripathi Nirala Card */}
            <div
              onClick={() => {
                updateFilter('author', 'सूर्यकांत त्रिपाठी \'निराला\'');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#2E1E14] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                नि
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#9BBF85] transition-colors">
                    सूर्यकांत त्रिपाठी 'निराला'
                  </h4>
                  <span className="text-[11px] font-bold text-[#9BBF85] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author.includes('निराला')).length} कृति →
                  </span>
                </div>
                <p className="text-xs text-[#2E1E14] font-semibold">महाप्राण (१८९९ – १९६१)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  बिल्लेसुर बकरिहा, परिमल, अनामिका, कुकुरमुत्ता
                </p>
              </div>
            </div>

            {/* Subhadra Kumari Chauhan Card */}
            <div
              onClick={() => {
                updateFilter('author', 'सुभद्रा कुमारी चौहान');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#3B142B] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                सु
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#E8B568] transition-colors">
                    सुभद्रा कुमारी चौहान
                  </h4>
                  <span className="text-[11px] font-bold text-[#E8B568] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'सुभद्रा कुमारी चौहान').length} कृति →
                  </span>
                </div>
                <p className="text-xs text-[#3B142B] font-semibold">राष्ट्रीय चेतना की अमर कवयित्री (१९०४ – १९४८)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  बिखरे मोती, मुकुल, झाँसी की रानी, उन्मादिनी
                </p>
              </div>
            </div>

            {/* Sant Kabir Das Card */}
            <div
              onClick={() => {
                updateFilter('author', 'संत कबीर दास');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#4D240E] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                क
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#F5C563] transition-colors">
                    संत कबीर दास
                  </h4>
                  <span className="text-[11px] font-bold text-[#F5C563] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'संत कबीर दास').length} कृति →
                  </span>
                </div>
                <p className="text-xs text-[#4D240E] font-semibold">निर्गुण भक्ति शाखा के महाकवि (१३९८ – १५१८)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  कबीर ग्रंथावली, साखी, सबद, रमैनी, बीजक
                </p>
              </div>
            </div>

            {/* Balmukund Gupt Card */}
            <div
              onClick={() => {
                updateFilter('author', 'बालमुकुंद गुप्त');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#3A1412] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                बा
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#F0C35B] transition-colors">
                    बालमुकुंद गुप्त
                  </h4>
                  <span className="text-[11px] font-bold text-[#F0C35B] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'बालमुकुंद गुप्त').length} कृति →
                  </span>
                </div>
                <p className="text-xs text-[#3A1412] font-semibold">हिन्दी राजनीतिक व्यंग्य के पुरोधा (१८६५ – १९०७)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  शिवशम्भु के चिट्ठे, बिदाई-सम्भाषण, भारतमित्र निबंध
                </p>
              </div>
            </div>

            {/* Acharya Ramchandra Shukla Card */}
            <div
              onClick={() => {
                updateFilter('author', 'आचार्य रामचंद्र शुक्ल');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#172619] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                शु
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#E2C068] transition-colors">
                    आचार्य रामचंद्र शुक्ल
                  </h4>
                  <span className="text-[11px] font-bold text-[#E2C068] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'आचार्य रामचंद्र शुक्ल').length} कृति →
                  </span>
                </div>
                <p className="text-xs text-[#172619] font-semibold">हिन्दी आलोचना व निबंध के शिखर पुरुष (१८८४ – १९४१)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  चिन्तामणि, उत्साह, भय, क्रोध, कविता क्या है
                </p>
              </div>
            </div>

            {/* Ayodhya Singh Upadhyay Hariaudh Card */}
            <div
              onClick={() => {
                updateFilter('author', "अयोध्या सिंह उपाध्याय 'हरिऔध'");
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#541D12] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                ह
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#F5A623] transition-colors">
                    अयोध्या सिंह उपाध्याय 'हरिऔध'
                  </h4>
                  <span className="text-[11px] font-bold text-[#F5A623] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author.includes('हरिऔध')).length} कृति →
                  </span>
                </div>
                <p className="text-xs text-[#541D12] font-semibold">खड़ी बोली महाकाव्य के प्रणेता (१८६५ – १९४७)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  प्रियप्रवास, वैदेही वनवास, चोखे चौपदे, ठेठ हिन्दी का ठाठ
                </p>
              </div>
            </div>

            {/* Goswami Tulsidas Card */}
            <div
              onClick={() => {
                updateFilter('author', 'गोस्वामी तुलसीदास');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#4D1C0F] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                तु
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#F5C563] transition-colors">
                    गोस्वामी तुलसीदास
                  </h4>
                  <span className="text-[11px] font-bold text-[#F5C563] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'गोस्वामी तुलसीदास').length} कृति →
                  </span>
                </div>
                <p className="text-xs text-[#4D1C0F] font-semibold">भक्तिकाल के शिरोमणि महाकवि (१५३२ – १६२३)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  कवितावली, दोहावली, रामचरितमानस, विनय पत्रिका
                </p>
              </div>
            </div>

            {/* Abdul Rahim Khan-i-Khana Card */}
            <div
              onClick={() => {
                updateFilter('author', 'कविवर रहीम');
                scrollToCollection();
              }}
              className="bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-2xs hover:shadow-md transition-all flex items-center gap-4 cursor-pointer group active:scale-[0.99]"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#0E291E] text-white flex items-center justify-center font-serif font-black text-xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                र
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#E8B568] transition-colors">
                    कविवर रहीम
                  </h4>
                  <span className="text-[11px] font-bold text-[#E8B568] group-hover:translate-x-0.5 transition-transform">
                    {books.filter((b) => b.author === 'कविवर रहीम').length} कृति →
                  </span>
                </div>
                <p className="text-xs text-[#0E291E] font-semibold">नीति व समन्वय के अमर कवि (१५५६ – १६२७)</p>
                <p className="text-[11px] text-[#1F1916]/60 mt-0.5">
                  रहीम दोहावली, बरवै नायिका भेद, मदनाष्टक, नगर शोभा
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
