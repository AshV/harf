import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  List,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Square,
  Play,
  Pause
} from 'lucide-react';
import type { BookMetadata, ChapterContent } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { useTTS } from '../../hooks/useTTS';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { SettingsSheet } from './SettingsSheet';
import { TOCDrawer } from './TOCDrawer';

interface ReaderViewProps {
  book: BookMetadata;
  chapter: ChapterContent;
  onSelectChapter: (chapterId: string) => void;
}

export const ReaderView: React.FC<ReaderViewProps> = ({
  book,
  chapter,
  onSelectChapter
}) => {
  const navigate = useNavigate();
  const { settings, updateSetting } = useSettings();
  const { isSpeaking, isPaused, activeBlockId, play, pause, resume, stop } = useTTS();
  const { saveProgress } = useReadingProgress(book.id);

  const [showChrome, setShowChrome] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Determine current chapter index in manifest
  const currentChapterIndex = book.chapters.findIndex((c) => c.id === chapter.chapter_id);
  const prevChapter = currentChapterIndex > 0 ? book.chapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex < book.chapters.length - 1
      ? book.chapters[currentChapterIndex + 1]
      : null;

  // Track scroll position for progress calculation
  useEffect(() => {
    const handleScroll = () => {
      const el = containerRef.current;
      if (!el) return;

      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressRatio = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;

      // Calculate overall book progress based on chapter index and current chapter scroll
      const chapterWeight = 100 / book.total_chapters;
      const overallPercent = Math.round(
        currentChapterIndex * chapterWeight + (progressRatio / 100) * chapterWeight
      );

      saveProgress(book.id, chapter.chapter_id, chapter.blocks[0]?.id || 'b_1', overallPercent);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [book.id, book.total_chapters, chapter.chapter_id, currentChapterIndex, saveProgress]);

  // Audio Read-Along sequence handler
  const handleToggleTTS = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      // Start reading from current block index
      startSpeakingBlock(currentBlockIndex);
    }
  };

  const startSpeakingBlock = (index: number) => {
    if (index >= chapter.blocks.length) {
      stop();
      return;
    }

    const block = chapter.blocks[index];
    setCurrentBlockIndex(index);

    // Scroll block into view
    const blockElement = blockRefs.current.get(block.id);
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    play(block.id, block.text, () => {
      // On block end, advance to next block automatically
      startSpeakingBlock(index + 1);
    });
  };

  const handleStopTTS = () => {
    stop();
    setCurrentBlockIndex(0);
  };

  // Center Tap toggles Zen mode
  const handleContentTap = (e: React.MouseEvent) => {
    // Only toggle if user didn't click a link or button
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;

    const height = window.innerHeight;
    const y = e.clientY;

    // Center 60% toggles chrome
    if (y > height * 0.2 && y < height * 0.8) {
      setShowChrome((prev) => !prev);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContentTap}
      className={`min-h-screen transition-colors duration-200 theme-${settings.theme} ${
        settings.fontFamily === 'serif' ? 'reader-serif' : 'reader-sans'
      }`}
    >
      {/* Top Bar (Auto-hiding Chrome) */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-transform duration-300 border-b ${
          showChrome ? 'translate-y-0' : '-translate-y-full'
        } ${
          settings.theme === 'night'
            ? 'bg-[#121212]/95 border-white/10 text-white'
            : 'bg-white/95 border-black/10 text-black'
        } backdrop-blur-md px-4 h-14 flex items-center justify-between shadow-xs`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/book/${book.id}`)}
            className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all"
            aria-label="वापस जाएँ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="truncate max-w-[200px] sm:max-w-md">
            <h2 className="text-sm font-bold truncate leading-tight font-hindi-serif">
              {book.title}
            </h2>
            <p className="text-[11px] opacity-60 truncate">{chapter.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowTOC(true)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="अनुक्रमणिका (TOC)"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            title="पठन सेटिंग्स (Settings)"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Reader Canvas */}
      <main className="max-w-2xl mx-auto px-5 sm:px-8 pt-20 pb-28 reader-canvas select-text">
        {/* Chapter Header */}
        <div className="text-center my-8 pb-6 border-b border-current opacity-20">
          <span className="text-xs font-semibold tracking-widest uppercase opacity-70">
            {book.title} • अध्याय {chapter.number}
          </span>
          <h1
            className="font-bold font-serif mt-2"
            style={{ fontSize: `${settings.fontSize * 1.5}px` }}
          >
            {chapter.title}
          </h1>
        </div>

        {/* Paragraph Blocks */}
        <div className="space-y-6">
          {chapter.blocks.map((block, index) => {
            const isActiveTTS = activeBlockId === block.id;

            return (
              <div
                key={block.id}
                ref={(el) => {
                  if (el) blockRefs.current.set(block.id, el);
                  else blockRefs.current.delete(block.id);
                }}
                className={`transition-all duration-200 ${
                  isActiveTTS ? 'active-tts-block' : ''
                }`}
                style={{
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: settings.lineHeight
                }}
              >
                {block.type === 'quote' ? (
                  <blockquote className="border-l-4 border-[#C05621] pl-4 italic opacity-95 my-4">
                    {block.text}
                  </blockquote>
                ) : block.type === 'h2' ? (
                  <h3 className="font-bold font-serif text-lg my-4 opacity-95">
                    {block.text}
                  </h3>
                ) : (
                  <p
                    className="cursor-pointer"
                    onClick={(e) => {
                      // Click paragraph to start speaking from here if TTS is open
                      if (isSpeaking) {
                        e.stopPropagation();
                        startSpeakingBlock(index);
                      }
                    }}
                  >
                    {block.text}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Chapter End Navigation */}
        <div className="mt-16 pt-8 border-t border-current opacity-25 flex items-center justify-between">
          {prevChapter ? (
            <button
              onClick={() => {
                onSelectChapter(prevChapter.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-xs font-bold hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>पिछला: {prevChapter.title}</span>
            </button>
          ) : (
            <div />
          )}

          {nextChapter ? (
            <button
              onClick={() => {
                onSelectChapter(nextChapter.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 text-xs font-bold hover:underline"
            >
              <span>अगला: {nextChapter.title}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs font-semibold opacity-70">पुस्तक समाप्त</span>
          )}
        </div>
      </main>

      {/* Floating Audio Read-Along Bar */}
      <div
        className={`fixed bottom-16 right-4 z-40 transition-all duration-300 ${
          showChrome ? 'opacity-100 translate-y-0' : 'opacity-80 translate-y-2'
        }`}
      >
        <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#2C221E] text-[#FBF0D9] shadow-xl border border-white/10">
          <button
            onClick={handleToggleTTS}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C05621] text-white font-medium text-xs hover:bg-[#C05621]/90 transition-all active:scale-95"
            title="सुनें (Read Aloud)"
          >
            {isSpeaking && !isPaused ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>रोकें</span>
              </>
            ) : isSpeaking && isPaused ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>जारी रखें</span>
              </>
            ) : (
              <>
                <Headphones className="w-3.5 h-3.5" />
                <span>सुनें</span>
              </>
            )}
          </button>

          {isSpeaking && (
            <button
              onClick={handleStopTTS}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/80 transition-colors"
              title="बंद करें"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Bottom Thumb Control Bar (Chrome) */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-30 transition-transform duration-300 border-t ${
          showChrome ? 'translate-y-0' : 'translate-y-full'
        } ${
          settings.theme === 'night'
            ? 'bg-[#121212]/95 border-white/10 text-white'
            : 'bg-white/95 border-black/10 text-black'
        } backdrop-blur-md px-4 h-14 flex items-center justify-between shadow-lg`}
      >
        <button
          disabled={!prevChapter}
          onClick={() => prevChapter && onSelectChapter(prevChapter.id)}
          className="p-2 rounded-xl disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
          title="पिछला अध्याय"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setShowTOC(true)}
          className="text-center px-3 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
        >
          <span className="text-xs font-bold block truncate max-w-[200px]">
            {chapter.title}
          </span>
          <span className="text-[10px] opacity-60">
            अध्याय {chapter.number} / {book.total_chapters}
          </span>
        </button>

        <button
          disabled={!nextChapter}
          onClick={() => nextChapter && onSelectChapter(nextChapter.id)}
          className="p-2 rounded-xl disabled:opacity-30 hover:bg-black/5 dark:hover:bg-white/10 transition-all"
          title="अगला अध्याय"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </footer>

      {/* Modals & Sheets */}
      <SettingsSheet
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={updateSetting}
      />

      <TOCDrawer
        isOpen={showTOC}
        onClose={() => setShowTOC(false)}
        book={book}
        currentChapterId={chapter.chapter_id}
        onSelectChapter={onSelectChapter}
      />
    </div>
  );
};

