import React, { useState } from 'react';
import { X, Bookmark, Highlighter, Trash2, ArrowRight } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';

interface NotebookDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: string;
  onJumpTo: (chapterId: string, blockId: string) => void;
}

export const NotebookDrawer: React.FC<NotebookDrawerProps> = ({
  isOpen,
  onClose,
  bookId,
  onJumpTo
}) => {
  const [activeTab, setActiveTab] = useState<'highlights' | 'bookmarks'>('highlights');

  // Query highlights & bookmarks from Dexie
  const highlights = useLiveQuery(
    async () => {
      return await db.highlights.where('book_id').equals(bookId).reverse().sortBy('created_at');
    },
    [bookId]
  );

  const bookmarks = useLiveQuery(
    async () => {
      return await db.bookmarks.where('book_id').equals(bookId).reverse().sortBy('created_at');
    },
    [bookId]
  );

  if (!isOpen) return null;

  const colorStyles = {
    yellow: 'bg-yellow-100 border-yellow-300 text-yellow-900',
    green: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    amber: 'bg-amber-100 border-amber-300 text-amber-900',
    rose: 'bg-rose-100 border-rose-300 text-rose-900'
  };

  const handleDeleteHighlight = async (id?: number) => {
    if (id !== undefined) {
      await db.highlights.delete(id);
    }
  };

  const handleDeleteBookmark = async (id?: number) => {
    if (id !== undefined) {
      await db.bookmarks.delete(id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-[#FAF7F2] text-[#1F1916] h-full shadow-2xl flex flex-col border-l border-[#231A15]/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#231A15]/10 flex items-center justify-between bg-white/60">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#C85A32]" />
            <h3 className="font-bold text-base font-serif">मेरी नोटबुक (Notebook)</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5">
            <X className="w-5 h-5 opacity-70" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-2 gap-1 bg-[#231A15]/5 border-b border-[#231A15]/10 text-xs font-bold">
          <button
            onClick={() => setActiveTab('highlights')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'highlights'
                ? 'bg-white text-[#C85A32] shadow-xs'
                : 'text-[#1F1916]/60 hover:text-[#1F1916]'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>हाइलाइट्स ({highlights?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'bookmarks'
                ? 'bg-white text-[#C85A32] shadow-xs'
                : 'text-[#1F1916]/60 hover:text-[#1F1916]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>बुकमार्क्स ({bookmarks?.length || 0})</span>
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeTab === 'highlights' ? (
            highlights && highlights.length > 0 ? (
              highlights.map((h) => (
                <div
                  key={h.id}
                  className={`p-3.5 rounded-2xl border shadow-2xs relative group transition-all ${
                    colorStyles[h.color] || colorStyles.yellow
                  }`}
                >
                  <p className="font-serif italic text-xs sm:text-sm leading-relaxed mb-2 line-clamp-4">
                    "{h.selected_text}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-semibold opacity-75 pt-2 border-t border-current/15">
                    <span>{new Date(h.created_at).toLocaleDateString('hi-IN')}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onJumpTo(h.chapter_id, h.block_id);
                          onClose();
                        }}
                        className="hover:underline flex items-center gap-0.5 font-bold cursor-pointer"
                      >
                        <span>पढ़ें</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleDeleteHighlight(h.id)}
                        className="p-1 hover:text-red-700 transition-colors cursor-pointer"
                        title="हटाएँ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-[#1F1916]/40 text-xs">
                <Highlighter className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>अभी तक कोई वाक्य हाइलाइट नहीं किया गया है।</p>
                <p className="text-[11px] mt-1 opacity-70">
                  पढ़ते समय किसी भी वाक्य को सेलेक्ट करके हाइलाइट करें।
                </p>
              </div>
            )
          ) : bookmarks && bookmarks.length > 0 ? (
            bookmarks.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-white border border-[#231A15]/10 shadow-2xs group transition-all"
              >
                <p className="font-hindi-serif text-xs leading-relaxed text-[#1F1916]/80 line-clamp-3 mb-2">
                  "{b.snippet}"
                </p>

                <div className="flex items-center justify-between text-[10px] text-[#1F1916]/50 pt-2 border-t border-black/5 font-semibold">
                  <span>{new Date(b.created_at).toLocaleDateString('hi-IN')}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onJumpTo(b.chapter_id, b.block_id);
                        onClose();
                      }}
                      className="text-[#C85A32] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>यहाँ जाएँ</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => handleDeleteBookmark(b.id)}
                      className="p-1 hover:text-red-600 transition-colors cursor-pointer"
                      title="हटाएँ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-[#1F1916]/40 text-xs">
              <Bookmark className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>कोई बुकमार्क नहीं मिला।</p>
              <p className="text-[11px] mt-1 opacity-70">
                किसी भी पैराग्राफ़ को सेलेक्ट करके बुकमार्क में जोड़ें।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
