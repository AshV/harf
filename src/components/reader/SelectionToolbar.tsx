import React from 'react';
import { Bookmark, Share2, Copy, Check } from 'lucide-react';
import type { HighlightColor } from '../../types';

interface SelectionToolbarProps {
  position: { top: number; left: number } | null;
  selectedText: string;
  onHighlight: (color: HighlightColor) => void;
  onBookmark: () => void;
  onOpenQuoteCard: () => void;
  onClose: () => void;
}

export const SelectionToolbar: React.FC<SelectionToolbarProps> = ({
  position,
  selectedText,
  onHighlight,
  onBookmark,
  onOpenQuoteCard,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!position || !selectedText.trim()) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      onClose();
    }, 1200);
  };

  const highlightColors: { id: HighlightColor; bg: string; border: string; title: string }[] = [
    { id: 'yellow', bg: '#FEF08A', border: '#EAB308', title: 'पीला' },
    { id: 'green', bg: '#BBF7D0', border: '#22C55E', title: 'हरा' },
    { id: 'amber', bg: '#FED7AA', border: '#F97316', title: 'नारंगी' },
    { id: 'rose', bg: '#FECDD3', border: '#F43F5E', title: 'गुलाबी' }
  ];

  return (
    <div
      style={{
        top: `${Math.max(10, position.top - 54)}px`,
        left: `${Math.max(16, Math.min(window.innerWidth - 280, position.left))}px`
      }}
      className="fixed z-50 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#1F1916]/95 backdrop-blur-md text-[#FAF5E8] shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-150 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Highlight Color Dots */}
      <div className="flex items-center gap-1 pr-1 border-r border-white/10">
        {highlightColors.map((c) => (
          <button
            key={c.id}
            onClick={() => onHighlight(c.id)}
            style={{ backgroundColor: c.bg, borderColor: c.border }}
            className="w-5 h-5 rounded-full border shadow-2xs hover:scale-115 active:scale-95 transition-transform"
            title={`हाइलाइट करें (${c.title})`}
          />
        ))}
      </div>

      {/* Bookmark Action */}
      <button
        onClick={onBookmark}
        className="flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-xs font-semibold"
        title="बुकमार्क सहेजें"
      >
        <Bookmark className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden xs:inline">बुकमार्क</span>
      </button>

      {/* Quote Card Generator */}
      <button
        onClick={onOpenQuoteCard}
        className="flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-xs font-semibold"
        title="सुविचार कार्ड बनाएँ"
      >
        <Share2 className="w-3.5 h-3.5 text-[#E08E45]" />
        <span>कार्ड</span>
      </button>

      {/* Copy Action */}
      <button
        onClick={handleCopy}
        className="p-1.5 rounded-xl hover:bg-white/10 text-white/80 active:scale-95 transition-all"
        title="कॉपी करें"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
