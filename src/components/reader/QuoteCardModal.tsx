import React, { useState } from 'react';
import { X, Quote, Share2, Copy, Check } from 'lucide-react';

interface QuoteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteText: string;
  bookTitle: string;
  author: string;
}

export const QuoteCardModal: React.FC<QuoteCardModalProps> = ({
  isOpen,
  onClose,
  quoteText,
  bookTitle,
  author
}) => {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'parchment' | 'dark' | 'terracotta'>('parchment');

  if (!isOpen || !quoteText) return null;

  const cardThemes = {
    parchment: {
      bg: 'bg-gradient-to-br from-[#FAF3E0] via-[#FDFBF7] to-[#F5ECE0]',
      text: 'text-[#2C1810]',
      authorText: 'text-[#C85A32]',
      quoteColor: 'text-[#C85A32]/15',
      border: 'border-[#2C1810]/15'
    },
    dark: {
      bg: 'bg-gradient-to-br from-[#1C1412] via-[#2A1D19] to-[#140D0B]',
      text: 'text-[#FAF5E8]',
      authorText: 'text-[#E08E45]',
      quoteColor: 'text-[#E08E45]/15',
      border: 'border-white/10'
    },
    terracotta: {
      bg: 'bg-gradient-to-br from-[#4D1515] via-[#661D1D] to-[#360D0D]',
      text: 'text-[#FFF8EE]',
      authorText: 'text-[#F3C969]',
      quoteColor: 'text-[#F3C969]/15',
      border: 'border-[#F3C969]/30'
    }
  }[theme];

  const shareText = `"${quoteText.trim()}"\n\n— ${author} (${bookTitle})\n\nहर्फ़ (Harf) ई-पुस्तकालय पर पढ़ें।`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${bookTitle} — सुविचार`,
        text: shareText
      });
    } else {
      handleCopy();
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-black/10 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-[#1F1916]">
            साहित्यिक सुविचार कार्ड
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5 opacity-60" />
          </button>
        </div>

        {/* The Visual Card */}
        <div
          className={`relative p-6 sm:p-8 rounded-2xl ${cardThemes.bg} ${cardThemes.border} border shadow-lg overflow-hidden transition-all duration-300`}
        >
          {/* Giant Decorative Quote Glyph */}
          <Quote
            className={`absolute -bottom-4 -right-4 w-28 h-28 ${cardThemes.quoteColor} rotate-180 pointer-events-none`}
          />

          <div className="relative z-10 flex flex-col justify-between min-h-[160px]">
            {/* Top Brand Tag */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase opacity-60 mb-4">
              <span>✦ हर्फ़ क्लासिक्स ✦</span>
            </div>

            {/* The Quote Body */}
            <p
              className={`font-serif italic font-medium leading-relaxed ${cardThemes.text} ${
                quoteText.length > 120 ? 'text-sm sm:text-base' : 'text-base sm:text-lg'
              }`}
            >
              "{quoteText.trim()}"
            </p>

            {/* Author Attribution */}
            <div className="mt-6 pt-4 border-t border-current/10">
              <h4 className={`font-bold text-sm ${cardThemes.authorText} font-serif`}>
                {author}
              </h4>
              <p className={`text-xs opacity-70 ${cardThemes.text} font-medium`}>
                कृति: {bookTitle}
              </p>
            </div>
          </div>
        </div>

        {/* Theme Picker */}
        <div className="flex items-center justify-between text-xs font-semibold text-[#1F1916]/70">
          <span>पृष्ठ शैली चुनें:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme('parchment')}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                theme === 'parchment'
                  ? 'bg-[#FAF3E0] text-[#2C1810] border-[#C85A32]'
                  : 'bg-white border-black/10'
              }`}
            >
              कागज़
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-[#1C1412] text-[#FAF5E8] border-[#E08E45]'
                  : 'bg-white border-black/10'
              }`}
            >
              रात
            </button>
            <button
              onClick={() => setTheme('terracotta')}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                theme === 'terracotta'
                  ? 'bg-[#4D1515] text-[#FFF8EE] border-[#F3C969]'
                  : 'bg-white border-black/10'
              }`}
            >
              गेरुआ
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-black/5">
          <button
            onClick={handleShare}
            className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#C85A32] to-[#E08E45] text-white font-bold text-xs shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span>साझा करें (Share)</span>
          </button>

          <button
            onClick={handleCopy}
            className="py-3 px-4 rounded-xl bg-black/5 hover:bg-black/10 text-[#1F1916] font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">कॉपी हो गया!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>टेक्स्ट कॉपी करें</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
