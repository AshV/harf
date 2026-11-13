import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Sparkles } from 'lucide-react';
import type { BookSummary, ReadingProgress } from '../../types';

interface HeroContinueCardProps {
  book: BookSummary;
  progress: ReadingProgress;
}

export const HeroContinueCard: React.FC<HeroContinueCardProps> = ({ book, progress }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2C221E] to-[#43342E] text-[#FBF0D9] p-5 sm:p-6 shadow-xl mb-8">
      {/* Subtle Background Accent */}
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#F6AD55] mb-2 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>पढ़ना जारी रखें</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-serif leading-tight">
            {book.title}
          </h2>
          <p className="text-sm text-[#FBF0D9]/70 mt-1 font-medium">
            {book.author} • {book.category}
          </p>

          {/* Progress Bar */}
          <div className="mt-4 max-w-xs">
            <div className="flex justify-between text-xs font-medium text-[#FBF0D9]/60 mb-1.5">
              <span>प्रगति</span>
              <span>{progress.percentage}% पूर्ण</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-[#F6AD55] rounded-full transition-all duration-300"
                style={{ width: `${Math.max(5, progress.percentage)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Link
          to={`/read/${book.id}/${progress.chapter_id}`}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#F6AD55] text-[#2C221E] font-bold text-sm shadow-md hover:bg-[#F6AD55]/90 transition-all active:scale-95 shrink-0"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>पठन जारी रखें</span>
        </Link>
      </div>
    </div>
  );
};

