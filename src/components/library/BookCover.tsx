import React from 'react';

interface BookCoverProps {
  id: string;
  title: string;
  author: string;
  category?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

interface Palette {
  bgGradient: string;
  borderColor: string;
  titleColor: string;
  authorColor: string;
  accentColor: string;
  badgeBg: string;
  motif: string;
}

const PALETTES: Record<string, Palette> = {
  kaffan: {
    bgGradient: 'from-[#1A1817] via-[#2D2421] to-[#171413]',
    borderColor: 'border-[#D4AF37]/40',
    titleColor: 'text-[#FAF5E8]',
    authorColor: 'text-[#D4AF37]',
    accentColor: '#D4AF37',
    badgeBg: 'bg-[#D4AF37]/15 text-[#F3E5AB]',
    motif: '✦ ❖ ✦'
  },
  'panch-parameshwar': {
    bgGradient: 'from-[#0F1D33] via-[#1A2C4B] to-[#0A1322]',
    borderColor: 'border-[#E0A948]/40',
    titleColor: 'text-[#FAF8F5]',
    authorColor: 'text-[#E0A948]',
    accentColor: '#E0A948',
    badgeBg: 'bg-[#E0A948]/15 text-[#FBE3B5]',
    motif: '❖ ⚖️ ❖'
  },
  idgah: {
    bgGradient: 'from-[#0D281E] via-[#163D2E] to-[#081B14]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FCFAF2]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEAC1]',
    motif: '✦ 🌙 ✦'
  },
  'bade-bhai-sahab': {
    bgGradient: 'from-[#5C1D16] via-[#7A281E] to-[#45120D]',
    borderColor: 'border-[#EBB059]/40',
    titleColor: 'text-[#FFF9EE]',
    authorColor: 'text-[#EBB059]',
    accentColor: '#EBB059',
    badgeBg: 'bg-[#EBB059]/15 text-[#FDE5BD]',
    motif: '❖ 📜 ❖'
  },
  godaan: {
    bgGradient: 'from-[#4A2013] via-[#632C1A] to-[#36160B]',
    borderColor: 'border-[#E2A745]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E2A745]',
    accentColor: '#E2A745',
    badgeBg: 'bg-[#E2A745]/15 text-[#FDE7BE]',
    motif: '✦ 🌾 ✦'
  },
  mamta: {
    bgGradient: 'from-[#3B1E48] via-[#4D285E] to-[#2B1435]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#FAF5FD]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '❖ 🏰 ❖'
  },
  'andher-nagari': {
    bgGradient: 'from-[#4D1515] via-[#661D1D] to-[#360D0D]',
    borderColor: 'border-[#E5A93C]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#E5A93C]',
    accentColor: '#E5A93C',
    badgeBg: 'bg-[#E5A93C]/15 text-[#FDE7BE]',
    motif: '❖ 👑 ❖'
  },
  'rani-ketki-ki-kahani': {
    bgGradient: 'from-[#421A2C] via-[#5C243D] to-[#2E111E]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#FFF5F8]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FCEAC5]',
    motif: '✦ 🌺 ✦'
  },
  kamayani: {
    bgGradient: 'from-[#0D1D2D] via-[#162D44] to-[#08121C]',
    borderColor: 'border-[#93B5C6]/40',
    titleColor: 'text-[#EBF3F8]',
    authorColor: 'text-[#93B5C6]',
    accentColor: '#93B5C6',
    badgeBg: 'bg-[#93B5C6]/15 text-[#D4E4ED]',
    motif: '✦ 🏔️ ✦'
  },
  nirmala: {
    bgGradient: 'from-[#54201A] via-[#702B23] to-[#3D1511]',
    borderColor: 'border-[#E8AA58]/40',
    titleColor: 'text-[#FFF9F2]',
    authorColor: 'text-[#E8AA58]',
    accentColor: '#E8AA58',
    badgeBg: 'bg-[#E8AA58]/15 text-[#FDE6BD]',
    motif: '❖ 🕊️ ❖'
  },
  'chandrakanta-santati-1': {
    bgGradient: 'from-[#0C1A2B] via-[#152B46] to-[#07111D]',
    borderColor: 'border-[#F3C969]/40',
    titleColor: 'text-[#FCFAF2]',
    authorColor: 'text-[#F3C969]',
    accentColor: '#F3C969',
    badgeBg: 'bg-[#F3C969]/15 text-[#FDF0CD]',
    motif: '❖ 🗝️ ❖'
  },
  'chandrakanta-santati-2': {
    bgGradient: 'from-[#0C241D] via-[#143B2F] to-[#071813]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#FCFAF2]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '✦ 🗡️ ✦'
  },
  'bharat-durdasha': {
    bgGradient: 'from-[#4A1212] via-[#661A1A] to-[#330A0A]',
    borderColor: 'border-[#E0A948]/40',
    titleColor: 'text-[#FAF5E8]',
    authorColor: 'text-[#E0A948]',
    accentColor: '#E0A948',
    badgeBg: 'bg-[#E0A948]/15 text-[#FDE3B5]',
    motif: '✦ 🎭 ✦'
  },
  'satya-harishchandra': {
    bgGradient: 'from-[#4D280B] via-[#6B370E] to-[#361B07]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FFF9F0]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEAC1]',
    motif: '❖ ☀️ ❖'
  },
  'bikhare-moti': {
    bgGradient: 'from-[#3B142B] via-[#521C3C] to-[#2B0E20]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#FFF5FB]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FCEAC5]',
    motif: '✦ 🦪 ✦'
  },
  'billesur-bakriha': {
    bgGradient: 'from-[#2E1E14] via-[#422B1D] to-[#1F140D]',
    borderColor: 'border-[#9BBF85]/40',
    titleColor: 'text-[#F5F8F2]',
    authorColor: 'text-[#9BBF85]',
    accentColor: '#9BBF85',
    badgeBg: 'bg-[#9BBF85]/15 text-[#E4F0DE]',
    motif: '❖ 🌾 ❖'
  },
  'shivshambhu-ke-chitthe': {
    bgGradient: 'from-[#3A1412] via-[#521C1A] to-[#260B0A]',
    borderColor: 'border-[#F0C35B]/40',
    titleColor: 'text-[#FAF5E8]',
    authorColor: 'text-[#F0C35B]',
    accentColor: '#F0C35B',
    badgeBg: 'bg-[#F0C35B]/15 text-[#FCEAC1]',
    motif: '❖ ⚖️ ❖'
  },
  dhruvaswamini: {
    bgGradient: 'from-[#141B34] via-[#1E284D] to-[#0D1224]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#F5F7FD]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '✦ 👑 ✦'
  },
  neeldevi: {
    bgGradient: 'from-[#0C243B] via-[#123657] to-[#081829]',
    borderColor: 'border-[#E8B568]/40',
    titleColor: 'text-[#F0F7FD]',
    authorColor: 'text-[#E8B568]',
    accentColor: '#E8B568',
    badgeBg: 'bg-[#E8B568]/15 text-[#FCEAC5]',
    motif: '❖ ⚔️ ❖'
  },
  'kabir-granthavali': {
    bgGradient: 'from-[#4D240E] via-[#6B3213] to-[#361708]',
    borderColor: 'border-[#F5C563]/40',
    titleColor: 'text-[#FFF9EE]',
    authorColor: 'text-[#F5C563]',
    accentColor: '#F5C563',
    badgeBg: 'bg-[#F5C563]/15 text-[#FDF0CD]',
    motif: '✦ 🪔 ✦'
  },
  aakashdeep: {
    bgGradient: 'from-[#09222E] via-[#0E3547] to-[#051720]',
    borderColor: 'border-[#68C5DB]/40',
    titleColor: 'text-[#F0FAFD]',
    authorColor: 'text-[#68C5DB]',
    accentColor: '#68C5DB',
    badgeBg: 'bg-[#68C5DB]/15 text-[#D1F0F7]',
    motif: '✦ 🌟 ✦'
  },
  priyapravas: {
    bgGradient: 'from-[#541D12] via-[#752617] to-[#3D120B]',
    borderColor: 'border-[#F5A623]/40',
    titleColor: 'text-[#FFF8EE]',
    authorColor: 'text-[#F5A623]',
    accentColor: '#F5A623',
    badgeBg: 'bg-[#F5A623]/15 text-[#FDEACC]',
    motif: '✦ 🌅 ✦'
  },
  chintamani: {
    bgGradient: 'from-[#172619] via-[#223826] to-[#101C12]',
    borderColor: 'border-[#E2C068]/40',
    titleColor: 'text-[#F5F8F4]',
    authorColor: 'text-[#E2C068]',
    accentColor: '#E2C068',
    badgeBg: 'bg-[#E2C068]/15 text-[#FBEFCF]',
    motif: '❖ 🖋️ ❖'
  },
  'pariksha-guru': {
    bgGradient: 'from-[#382315] via-[#4F321E] to-[#26170D]',
    borderColor: 'border-[#E5B55A]/40',
    titleColor: 'text-[#FAF6F0]',
    authorColor: 'text-[#E5B55A]',
    accentColor: '#E5B55A',
    badgeBg: 'bg-[#E5B55A]/15 text-[#FCEAC1]',
    motif: '✦ 🏛️ ✦'
  },
  'bihari-satsai': {
    bgGradient: 'from-[#4D290A] via-[#6E3B0F] to-[#361B06]',
    borderColor: 'border-[#F5C563]/40',
    titleColor: 'text-[#FFF9EE]',
    authorColor: 'text-[#F5C563]',
    accentColor: '#F5C563',
    badgeBg: 'bg-[#F5C563]/15 text-[#FDF0CD]',
    motif: '❖ 🏹 ❖'
  }
};

const DEFAULT_PALETTE: Palette = {
  bgGradient: 'from-[#2A1810] via-[#3E2317] to-[#1F120B]',
  borderColor: 'border-[#D8A856]/40',
  titleColor: 'text-[#FAF7F2]',
  authorColor: 'text-[#D8A856]',
  accentColor: '#D8A856',
  badgeBg: 'bg-[#D8A856]/15 text-[#FDE3B5]',
  motif: '✦ ❖ ✦'
};

export const BookCover: React.FC<BookCoverProps> = ({
  id,
  title,
  author,
  category = 'कहानी',
  size = 'md',
  className = ''
}) => {
  const palette = PALETTES[id] || DEFAULT_PALETTE;

  // Sizing definitions
  const sizeClasses = {
    sm: 'w-24 aspect-[2/3]',
    md: 'w-full aspect-[2/3]',
    lg: 'w-48 aspect-[2/3]',
    hero: 'w-44 sm:w-56 aspect-[2/3]'
  }[size];

  return (
    <div
      className={`relative select-none rounded-xl overflow-hidden shadow-xl transition-all duration-300 ${sizeClasses} ${className}`}
      style={{
        boxShadow:
          '0 12px 28px -6px rgba(0, 0, 0, 0.35), 0 6px 14px -4px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
      }}
    >
      {/* 3D Book Spine Effect (Left Side Depth & Crease) */}
      <div className="absolute left-0 top-0 bottom-0 w-3.5 bg-gradient-to-r from-black/50 via-white/10 to-transparent z-20 pointer-events-none" />
      <div className="absolute left-3.5 top-0 bottom-0 w-[1px] bg-black/40 z-20 pointer-events-none" />

      {/* Book Cloth / Paper Texture Background */}
      <div
        className={`w-full h-full bg-gradient-to-b ${palette.bgGradient} p-3.5 sm:p-4 flex flex-col justify-between relative overflow-hidden`}
      >
        {/* Subtle Ornamental Background Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 50% 50%, white 1.5px, transparent 1.5px)`,
            backgroundSize: '16px 16px'
          }}
        />

        {/* Outer Filigree Border */}
        <div
          className={`absolute inset-2 border ${palette.borderColor} rounded-lg pointer-events-none flex flex-col justify-between p-1`}
        >
          {/* Inner Inset Border */}
          <div className="w-full h-full border border-dashed border-white/15 rounded-md pointer-events-none" />
        </div>

        {/* Top Header: Category Tag & Series */}
        <div className="relative z-10 text-center pt-1">
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest uppercase ${palette.badgeBg}`}
          >
            {category}
          </span>
          <div className="text-[10px] sm:text-[11px] opacity-70 mt-1" style={{ color: palette.accentColor }}>
            {palette.motif}
          </div>
        </div>

        {/* Center: Book Title in Classic Serif Typography */}
        <div className="relative z-10 text-center px-2 my-auto">
          <h3
            className={`font-serif font-black tracking-wide leading-tight ${palette.titleColor} drop-shadow-md line-clamp-2 ${
              size === 'sm'
                ? 'text-xs'
                : size === 'hero'
                ? 'text-2xl sm:text-3xl'
                : 'text-lg sm:text-xl'
            }`}
          >
            {title}
          </h3>

          {/* Delicate Divider Ornament */}
          <div className="flex items-center justify-center gap-1.5 my-2 opacity-50">
            <div className="h-[1px] w-5 bg-current" style={{ color: palette.accentColor }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ backgroundColor: palette.accentColor }} />
            <div className="h-[1px] w-5 bg-current" style={{ color: palette.accentColor }} />
          </div>

          <p
            className={`font-hindi-serif font-bold text-center line-clamp-1 ${palette.authorColor} ${
              size === 'sm' ? 'text-[10px]' : 'text-xs sm:text-sm'
            }`}
          >
            {author}
          </p>
        </div>

        {/* Bottom Publisher / Heritage Seal */}
        <div className="relative z-10 text-center pb-0.5">
          <span className="text-[8px] sm:text-[9px] font-semibold tracking-widest uppercase text-white/50 block">
            हर्फ़ साहित्य शृंखला
          </span>
        </div>
      </div>
    </div>
  );
};

