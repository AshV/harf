import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookMarked, CheckCircle2 } from 'lucide-react';
import type { BookSummary } from '../../types';

interface BookCardProps {
  book: BookSummary;
  isOffline?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, isOffline }) => {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group relative flex flex-col bg-white/70 hover:bg-white rounded-2xl p-4 border border-[#2C221E]/10 shadow-xs hover:shadow-md transition-all duration-200 active:scale-[0.98]"
    >
      {/* Cover / Letterhead placeholder */}
      <div className="relative aspect-[3/4] w-full rounded-xl bg-gradient-to-br from-[#2C221E]/10 via-[#2C221E]/5 to-transparent flex flex-col items-center justify-center p-4 border border-[#2C221E]/5 overflow-hidden mb-3">
        {/* Decorative corner ornament */}
        <div className="absolute top-2 left-2 text-[10px] font-bold text-[#2C221E]/30 uppercase tracking-widest">
          {book.category_en}
        </div>

        {isOffline && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>ऑफ़लाइन</span>
          </div>
        )}

        {/* Large stylized initial */}
        <span className="text-5xl font-serif font-black text-[#2C221E]/30 group-hover:text-[#C05621]/60 transition-colors">
          {book.title[0]}
        </span>
      </div>

      {/* Book Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-lg text-[#2C221E] group-hover:text-[#C05621] transition-colors leading-snug line-clamp-1 font-hindi-serif">
            {book.title}
          </h3>
          <p className="text-xs text-[#2C221E]/60 line-clamp-1 mt-0.5 font-medium">
            {book.author}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[11px] text-[#2C221E]/60 pt-3 border-t border-[#2C221E]/5 mt-2">
          <div className="flex items-center gap-1">
            <BookMarked className="w-3 h-3" />
            <span>{book.total_chapters} अध्याय</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>~{book.estimated_reading_minutes} मि.</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

