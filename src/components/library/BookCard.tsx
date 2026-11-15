import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, BookMarked, CheckCircle2 } from 'lucide-react';
import type { BookSummary } from '../../types';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: BookSummary;
  isOffline?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({ book, isOffline }) => {
  return (
    <Link
      to={`/book/${book.id}`}
      className="group relative flex flex-col focus:outline-none"
    >
      {/* 3D Book Cover Container with Hover Lift */}
      <div className="relative transform transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-[1.02]">
        <BookCover
          id={book.id}
          title={book.title}
          author={book.author}
          category={book.category}
          size="md"
        />

        {/* Offline Badge Pill */}
        {isOffline && (
          <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1 bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>ऑफ़लाइन</span>
          </div>
        )}
      </div>

      {/* Book Info Under Cover */}
      <div className="mt-3 px-1">
        <h3 className="font-bold text-base text-[#1F1916] group-hover:text-[#B84A2A] transition-colors leading-snug line-clamp-1 font-hindi-serif pt-1 pb-0.5 px-0.5">
          {book.title}
        </h3>
        <p
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.hash = `#/?author=${encodeURIComponent(book.author)}`;
          }}
          className="text-xs text-[#1F1916]/65 hover:text-[#C85A32] hover:underline line-clamp-1 mt-0.5 font-medium transition-colors cursor-pointer pt-0.5 px-0.5"
          title={`${book.author} की रचनाएँ देखें`}
        >
          {book.author}
        </p>

        {/* Metadata Footer */}
        <div className="flex items-center gap-2.5 text-[11px] text-[#1F1916]/55 mt-2 font-medium">
          <span className="flex items-center gap-1">
            <BookMarked className="w-3 h-3 text-[#1F1916]/40" />
            <span>{book.total_chapters} भाग</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#1F1916]/40" />
            <span>~{book.estimated_reading_minutes} मि.</span>
          </span>
        </div>
      </div>
    </Link>
  );
};
