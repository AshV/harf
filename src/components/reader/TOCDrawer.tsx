import React from 'react';
import { X, BookOpen, Clock, Check } from 'lucide-react';
import type { BookMetadata } from '../../types';

interface TOCDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookMetadata;
  currentChapterId: string;
  onSelectChapter: (chapterId: string) => void;
}

export const TOCDrawer: React.FC<TOCDrawerProps> = ({
  isOpen,
  onClose,
  book,
  currentChapterId,
  onSelectChapter
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#FBF0D9] dark:bg-[#1E1E20] text-[#2C221E] dark:text-[#E5E5E5] h-full shadow-2xl flex flex-col border-r border-[#2C221E]/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#2C221E]/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#C05621]" />
            <h3 className="font-bold text-base font-serif">अनुक्रमणिका (Chapters)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Book summary line */}
        <div className="px-4 py-3 bg-black/5 dark:bg-white/5 border-b border-[#2C221E]/5">
          <p className="font-bold text-sm truncate">{book.title}</p>
          <p className="text-xs opacity-70 truncate">{book.author} • कुल {book.total_chapters} अध्याय</p>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#2C221E]/5 dark:divide-white/5 p-2">
          {book.chapters.map((ch) => {
            const isCurrent = ch.id === currentChapterId;
            return (
              <div
                key={ch.id}
                onClick={() => {
                  onSelectChapter(ch.id);
                  onClose();
                }}
                className={`p-3 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                  isCurrent
                    ? 'bg-[#C05621]/15 text-[#C05621] font-bold'
                    : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-90'
                }`}
              >
                <div>
                  <h4 className="text-sm font-medium">{ch.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] opacity-60 mt-0.5">
                    <span>{ch.word_count} शब्द</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      ~{ch.estimated_minutes} मि.
                    </span>
                  </div>
                </div>

                {isCurrent && (
                  <span className="w-6 h-6 rounded-full bg-[#C05621] text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

