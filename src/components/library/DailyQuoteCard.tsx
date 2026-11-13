import React, { useState } from 'react';
import { Quote, Check, Share2 } from 'lucide-react';

const LITERARY_QUOTES = [
  {
    text: 'साहित्य का उद्देश्य हमारा मनोरंजन करना नहीं, हमारे अंदर मानवीय संवेदनाओं और न्याय की भावना को जगाना है।',
    author: 'मुंशी प्रेमचंद',
    source: 'साहित्य का उद्देश्य (१९३६)'
  },
  {
    text: 'पंच न किसी के दोस्त होते हैं, न किसी के दुश्मन। पंच के दिल में खुदा बसता है और उसके मुँह से न्याय निकलता है।',
    author: 'मुंशी प्रेमचंद',
    source: 'पंच परमेश्वर'
  },
  {
    text: 'बच्चे में कितना त्याग, कितना सद्भाव और कितना विवेक है! दूसरों को खिलौने लेते देखकर इसका मन कितना ललचाया होगा, पर वहाँ भी इसे अपनी बूढ़ी दादी की याद बनी रही।',
    author: 'मुंशी प्रेमचंद',
    source: 'ईदगाह'
  }
];

export const DailyQuoteCard: React.FC = () => {
  const [copied, setCopied] = useState(false);
  // Pick deterministic quote based on day of year
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const quote = LITERARY_QUOTES[dayOfYear % LITERARY_QUOTES.length];

  const handleShare = () => {
    const fullText = `"${quote.text}" — ${quote.author} (${quote.source}) \n\nहर्फ़ (Harf) ई-पुस्तकालय पर पढ़ें।`;
    if (navigator.share) {
      navigator.share({ text: fullText });
    } else {
      navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50/80 via-white/80 to-[#FAF3E0]/70 border border-[#2C221E]/10 p-5 shadow-xs mb-8">
      {/* Decorative Giant Quote Glyph */}
      <Quote className="absolute -bottom-3 -right-3 w-20 h-20 text-[#C85A32]/10 rotate-180 pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#C85A32] uppercase tracking-wider mb-2">
            <span>📜 आज का साहित्यिक विचार</span>
          </div>

          <p className="font-serif italic text-sm sm:text-base text-[#1F1916] leading-relaxed">
            "{quote.text}"
          </p>

          <p className="text-xs font-bold text-[#1F1916]/70 mt-2 font-hindi-serif">
            — {quote.author} <span className="font-normal opacity-60">({quote.source})</span>
          </p>
        </div>

        <button
          onClick={handleShare}
          className="p-2 rounded-xl bg-white hover:bg-black/5 text-[#1F1916]/70 border border-[#2C221E]/10 shrink-0 transition-all active:scale-95 shadow-xs"
          title="सुविचार साझा करें"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

