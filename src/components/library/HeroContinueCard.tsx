import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';
import type { BookSummary, ReadingProgress } from '../../types';
import { BookCover } from './BookCover';

interface HeroContinueCardProps {
  book: BookSummary;
  progress: ReadingProgress;
}

export const HeroContinueCard: React.FC<HeroContinueCardProps> = ({ book, progress }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#221611] via-[#2F1F18] to-[#1C120D] text-[#FAF5E8] p-5 sm:p-6 shadow-xl border border-amber-900/30 mb-8">
      {/* Background Accent Lighting */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-[#E08E45]/15 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
        <div className="flex items-center gap-4 flex-1">
          {/* Mini 3D Book Cover */}
          <div className="shrink-0 hidden xs:block">
            <BookCover
              id={book.id}
              title={book.title}
              author={book.author}
              category={book.category}
              size="sm"
            />
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#E08E45] mb-1 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>पठन जारी रखें (Continue Reading)</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold font-serif leading-tight">
              {book.title}
            </h2>
            <p className="text-xs text-[#FAF5E8]/70 mt-0.5 font-medium">
              {book.author} • {book.category}
            </p>

            {/* Progress Bar */}
            <div className="mt-3 max-w-xs">
              <div className="flex justify-between text-[11px] font-semibold text-[#FAF5E8]/70 mb-1">
                <span>प्रगति</span>
                <span className="text-[#E08E45]">{progress.percentage}% पूर्ण</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#E08E45] to-[#F6AD55] rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(6, progress.percentage)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/read/${book.id}/${progress.chapter_id}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#E08E45] to-[#C85A32] text-[#1F140E] font-bold text-xs sm:text-sm shadow-md hover:brightness-110 transition-all active:scale-95 shrink-0 w-full sm:w-auto justify-center"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>पठन जारी रखें</span>
        </Link>
      </div>
    </div>
  );
};
