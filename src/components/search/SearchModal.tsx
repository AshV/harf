import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Book, ArrowRight } from 'lucide-react';
import type { BookSummary } from '../../types';
import { searchBooks } from '../../utils/hinglish';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: BookSummary[];
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, books }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const results = searchBooks(books, query);

  const handleSelect = (bookId: string) => {
    onClose();
    navigate(`/book/${bookId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-[#FBF0D9] rounded-2xl shadow-2xl border border-[#2C221E]/15 overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#2C221E]/10 bg-white/40">
          <Search className="w-5 h-5 text-[#2C221E]/50 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="किताब या लेखक खोजें (e.g. 'Godan' या 'कफ़न')..."
            className="w-full bg-transparent text-[#2C221E] placeholder-[#2C221E]/40 text-base focus:outline-none font-medium"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-black/10 text-[#2C221E]/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-xs font-semibold px-2 py-1 rounded bg-[#2C221E]/10 text-[#2C221E]/70 hover:bg-[#2C221E]/15"
            >
              ESC
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-[#2C221E]/5">
          {results.length > 0 ? (
            results.map((book) => (
              <div
                key={book.id}
                onClick={() => handleSelect(book.id)}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-[#2C221E]/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 rounded bg-[#2C221E]/10 flex items-center justify-center text-[#2C221E]/60 shrink-0 font-serif font-bold text-lg">
                    {book.title[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-[#2C221E] group-hover:text-[#C05621] transition-colors">
                      {book.title}{' '}
                      <span className="text-xs font-normal text-[#2C221E]/50">({book.title_en})</span>
                    </h4>
                    <p className="text-xs text-[#2C221E]/70 font-medium">
                      {book.author} • {book.category}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#2C221E]/30 group-hover:text-[#C05621] group-hover:translate-x-1 transition-all" />
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[#2C221E]/50 text-sm">
              <Book className="w-8 h-8 mx-auto mb-2 opacity-40" />
              कोई पुस्तक नहीं मिली। अंग्रेजी या हिन्दी में लिखकर देखें।
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-black/5 border-t border-[#2C221E]/10 flex items-center justify-between text-[11px] text-[#2C221E]/60">
          <span>Hinglish व हिन्दी दोनों समर्थित हैं</span>
          <span>हर्फ़ पुस्तकालय</span>
        </div>
      </div>
    </div>
  );
};

