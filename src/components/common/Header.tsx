import React from 'react';
import { Link } from 'react-router-dom';
import { Search, HardDriveDownload } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  storageUsage?: { usedMB: number } | null;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSearch, storageUsage }) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FBF0D9]/95 backdrop-blur-md border-b border-[#2C221E]/10 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-[#2C221E] text-[#FBF0D9] flex items-center justify-center font-bold text-xl shadow-sm transition-transform group-hover:scale-105">
            ह
          </div>
          <div>
            <h1 className="font-bold text-xl text-[#2C221E] leading-tight font-hindi-serif">
              हर्फ़
            </h1>
            <p className="text-[11px] text-[#2C221E]/60 font-medium">हिन्दी ई-पुस्तकालय</p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {storageUsage && storageUsage.usedMB > 0 && (
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#2C221E]/5 text-[#2C221E]/70"
              title="ऑफ़लाइन मेमोरी उपयोग"
            >
              <HardDriveDownload className="w-3.5 h-3.5" />
              <span>{storageUsage.usedMB} MB ऑफ़लाइन</span>
            </div>
          )}

          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#2C221E]/5 hover:bg-[#2C221E]/10 text-[#2C221E] transition-all text-sm font-medium border border-[#2C221E]/10 active:scale-95"
            aria-label="खोजें (Search)"
          >
            <Search className="w-4 h-4 text-[#2C221E]/70" />
            <span className="hidden sm:inline text-xs text-[#2C221E]/70">खोजें (Hinglish / हिन्दी)...</span>
          </button>
        </div>
      </div>
    </header>
  );
};
