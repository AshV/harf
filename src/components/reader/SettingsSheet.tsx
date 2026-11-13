import React from 'react';
import { X, Type } from 'lucide-react';
import type { ReaderSettings, ReaderTheme } from '../../types';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdate: <K extends keyof ReaderSettings>(key: K, value: ReaderSettings[K]) => void;
}

export const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdate
}) => {
  if (!isOpen) return null;

  const themes: { id: ReaderTheme; label: string; bg: string; text: string; border: string }[] = [
    { id: 'parchment', label: 'कागज़', bg: '#FBF0D9', text: '#2C221E', border: '#D5C4A1' },
    { id: 'day', label: 'दिन', bg: '#FAFAFA', text: '#18181B', border: '#E4E4E7' },
    { id: 'night', label: 'रात', bg: '#121212', text: '#E5E5E5', border: '#2A2A2A' },
    { id: 'sage', label: 'शांत', bg: '#EAEFE9', text: '#1E293B', border: '#CBD5E1' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md rounded-t-3xl p-5 shadow-2xl border-t border-black/10 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header handle & close */}
        <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 opacity-70" />
            <h3 className="font-bold text-base text-[#1C1C1E] dark:text-[#E5E5E5]">
              पठन सेटिंग्स (Settings)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="w-5 h-5 opacity-60" />
          </button>
        </div>

        <div className="space-y-6 pt-4 text-sm">
          {/* Font Size Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-black/70 dark:text-white/70">अक्षर का आकार</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                {settings.fontSize}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-serif font-bold opacity-60">अ</span>
              <input
                type="range"
                min="16"
                max="28"
                step="1"
                value={settings.fontSize}
                onChange={(e) => onUpdate('fontSize', Number(e.target.value))}
                className="w-full h-1.5 bg-black/10 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#C05621]"
              />
              <span className="text-xl font-serif font-bold opacity-80">आ</span>
            </div>
          </div>

          {/* Theme Selector */}
          <div>
            <span className="block font-medium text-black/70 dark:text-white/70 mb-2">
              पृष्ठ का रंग (Theme)
            </span>
            <div className="grid grid-cols-4 gap-2">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdate('theme', t.id)}
                  style={{ backgroundColor: t.bg, color: t.text, borderColor: t.border }}
                  className={`py-2.5 px-1 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                    settings.theme === t.id
                      ? 'ring-2 ring-[#C05621] shadow-xs scale-[1.02]'
                      : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <span className="text-sm font-serif">अ</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Family Toggle */}
          <div>
            <span className="block font-medium text-black/70 dark:text-white/70 mb-2">
              फ़ॉन्ट शैली (Font Family)
            </span>
            <div className="grid grid-cols-2 gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl">
              <button
                onClick={() => onUpdate('fontFamily', 'serif')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  settings.fontFamily === 'serif'
                    ? 'bg-white dark:bg-[#2C2C2E] shadow-xs text-[#C05621]'
                    : 'text-black/60 dark:text-white/60 hover:text-black'
                }`}
              >
                सेरिफ़ (पारंपरिक / Serif)
              </button>
              <button
                onClick={() => onUpdate('fontFamily', 'sans')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  settings.fontFamily === 'sans'
                    ? 'bg-white dark:bg-[#2C2C2E] shadow-xs text-[#C05621]'
                    : 'text-black/60 dark:text-white/60 hover:text-black'
                }`}
              >
                सैन्स (आधुनिक / Sans)
              </button>
            </div>
          </div>

          {/* Line Height Toggle */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium text-black/70 dark:text-white/70">पंक्ति दूरी</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-black/5 dark:bg-white/10">
                {settings.lineHeight}x
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdate('lineHeight', 1.75)}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  settings.lineHeight === 1.75
                    ? 'border-[#C05621] bg-[#C05621]/10 text-[#C05621]'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                सामान्य (1.75x)
              </button>
              <button
                onClick={() => onUpdate('lineHeight', 1.95)}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  settings.lineHeight === 1.95
                    ? 'border-[#C05621] bg-[#C05621]/10 text-[#C05621]'
                    : 'border-black/10 dark:border-white/10'
                }`}
              >
                विस्तृत (1.95x)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
