import React from 'react';
import { Link } from 'react-router-dom';
import { Search, HardDriveDownload } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  storageUsage?: { usedMB: number } | null;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, storageUsage }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md border-b border-[#231A15]/8 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2C1810] via-[#3D2216] to-[#1F100B] text-[#FBF0D9] flex items-center justify-center font-bold text-xl shadow-md transition-transform duration-200 group-hover:scale-105 border border-amber-900/40">
            <span className="font-serif font-black text-[#F3E5AB]">ह</span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#E08E45] border-2 border-[#FAF7F2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-xl text-[#1F1916] leading-tight font-hindi-serif tracking-tight">
                हर्फ़
              </h1>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#C85A32]/10 text-[#C85A32] uppercase tracking-wider">
                क्लासिक्स
              </span>
            </div>
            <p className="text-[11px] text-[#1F1916]/60 font-medium">हिन्दी ई-पुस्तकालय</p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {storageUsage && storageUsage.usedMB > 0 && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 shadow-2xs"
              title="ऑफ़लाइन मेमोरी उपयोग"
            >
              <HardDriveDownload className="w-3.5 h-3.5 text-emerald-600" />
              <span>{storageUsage.usedMB} MB ऑफ़लाइन</span>
            </div>
          )}

          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-white/90 text-[#1F1916] transition-all text-xs font-semibold border border-[#231A15]/10 shadow-xs hover:shadow-sm active:scale-95 group"
            aria-label="खोजें (Search)"
          >
            <Search className="w-4 h-4 text-[#1F1916]/50 group-hover:text-[#B84A2A] transition-colors" />
            <span className="text-[#1F1916]/75">खोजें...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-[#1F1916]/5 text-[#1F1916]/50 border border-black/5">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
