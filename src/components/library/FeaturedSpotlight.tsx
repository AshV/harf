import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, BookOpen, Clock, ArrowRight } from 'lucide-react';
import type { BookSummary } from '../../types';
import { BookCover } from './BookCover';

interface FeaturedSpotlightProps {
  book: BookSummary;
}

export const FeaturedSpotlight: React.FC<FeaturedSpotlightProps> = ({ book }) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#231814] via-[#33221C] to-[#1C1411] text-[#FAF5E8] p-6 sm:p-8 shadow-2xl border border-amber-900/20 mb-10 group">
      {/* Warm Ambient Backlight */}
      <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-[#E08E45]/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-[#B84A2A]/20 blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10">
        {/* Large 3D Book Cover Presentation */}
        <div className="shrink-0 transform transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1">
          <BookCover
            id={book.id}
            title={book.title}
            author={book.author}
            category={book.category}
            size="hero"
          />
        </div>

        {/* Editorial Text & Content */}
        <div className="flex-1 text-center sm:text-left flex flex-col justify-between h-full py-1">
          <div>
            {/* Spotlight Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E08E45]/15 border border-[#E08E45]/30 text-[#F6AD55] text-xs font-bold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>आज की विशेष कृति • सम्पादक की पसंद</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black font-serif text-[#FAF5E8] leading-snug pt-1">
              {book.title}
            </h2>
            <p className="text-sm font-semibold text-[#D4AF37] mt-1 font-hindi-serif">
              {book.author} • {book.category} ({book.published_year || '१९३३'})
            </p>

            <p className="text-xs sm:text-sm text-[#FAF5E8]/75 leading-relaxed line-clamp-3 sm:line-clamp-4 mt-3 font-hindi-serif">
              {book.description}
            </p>

            {/* Quick Metadata */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#FAF5E8]/60 mt-4 font-medium">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#E08E45]" />
                <span>{book.total_chapters} अध्याय</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#E08E45]" />
                <span>~{book.estimated_reading_minutes} मिनट का पठन</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
            <Link
              to={`/read/${book.id}/ch_01`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#E08E45] to-[#C85A32] text-[#1F140E] font-bold text-sm shadow-lg hover:shadow-xl hover:brightness-110 transition-all active:scale-95"
            >
              <BookOpen className="w-4 h-4" />
              <span>अभी पढ़ना शुरू करें</span>
            </Link>

            <Link
              to={`/book/${book.id}`}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-[#FAF5E8] border border-white/10 font-bold text-sm transition-all active:scale-95"
            >
              <span>विवरण देखें</span>
              <ArrowRight className="w-4 h-4 opacity-70" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

