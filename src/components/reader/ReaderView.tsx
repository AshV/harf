import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  List,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Square,
  Play,
  Pause
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db';
import type { BookMetadata, ChapterContent, HighlightColor } from '../../types';
import { useSettings } from '../../hooks/useSettings';
import { useTTS } from '../../hooks/useTTS';
import { useReadingProgress } from '../../hooks/useReadingProgress';
import { SettingsSheet } from './SettingsSheet';
import { TOCDrawer } from './TOCDrawer';
import { SelectionToolbar } from './SelectionToolbar';
import { NotebookDrawer } from './NotebookDrawer';
import { QuoteCardModal } from './QuoteCardModal';

const sanitizeReaderText = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&#8288;/g, '')
    .replace(/&#91;/g, '[')
    .replace(/&#93;/g, ']')
    .replace(/&#42;/g, '*')
    .replace(/&#8195;/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/<\/?(?:poem|noinclude|ref|reg|br|ब्र)[\s\S]*?>/gi, '');
};

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
  const [showNotebook, setShowNotebook] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteTextForModal, setQuoteTextForModal] = useState('');
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0);

  const [selectionToolbar, setSelectionToolbar] = useState<{
    position: { top: number; left: number };
    text: string;
    blockId: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pendingJumpBlockIdRef = useRef<string | null>(null);

  // Fetch highlights for current book and chapter
  const highlights = useLiveQuery(
    async () => {
      return await db.highlights
        .where('book_id')
        .equals(book.id)
        .filter((h) => h.chapter_id === chapter.chapter_id)
        .toArray();
    },
    [book.id, chapter.chapter_id]
  ) || [];

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

  // Jump to pending block if set during cross-chapter jump
  useEffect(() => {
    if (pendingJumpBlockIdRef.current) {
      const targetBlockId = pendingJumpBlockIdRef.current;
      pendingJumpBlockIdRef.current = null;
      const timer = setTimeout(() => {
        const el = blockRefs.current.get(targetBlockId) || document.getElementById(`block-${targetBlockId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [chapter.chapter_id]);

  // Handle Text Selection for Highlight / Bookmark / Quote Card
  const handleSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionToolbar(null);
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) {
        setSelectionToolbar(null);
        return;
      }

      try {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) {
          setSelectionToolbar(null);
          return;
        }

        let parentNode: Node | null = range.startContainer;
        if (parentNode.nodeType !== Node.ELEMENT_NODE) {
          parentNode = parentNode.parentElement;
        }
        const blockEl = (parentNode as HTMLElement)?.closest('[data-block-id]');
        const blockId = blockEl?.getAttribute('data-block-id') || chapter.blocks[0]?.id || 'b_1';

        setSelectionToolbar({
          position: {
            top: rect.top,
            left: rect.left + rect.width / 2
          },
          text,
          blockId
        });
      } catch {
        setSelectionToolbar(null);
      }
    }, 60);
  };

  const handleHighlight = async (color: HighlightColor) => {
    if (!selectionToolbar) return;
    try {
      await db.highlights.add({
        book_id: book.id,
        chapter_id: chapter.chapter_id,
        block_id: selectionToolbar.blockId,
        selected_text: selectionToolbar.text,
        color,
        created_at: Date.now()
      });
    } catch (err) {
      console.error('Failed to add highlight:', err);
    }
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
  };

  const handleBookmark = async () => {
    if (!selectionToolbar) return;
    try {
      await db.bookmarks.add({
        book_id: book.id,
        chapter_id: chapter.chapter_id,
        block_id: selectionToolbar.blockId,
        snippet: selectionToolbar.text,
        created_at: Date.now()
      });
    } catch (err) {
      console.error('Failed to add bookmark:', err);
    }
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
  };

  const handleOpenQuoteCard = () => {
    if (!selectionToolbar) return;
    setQuoteTextForModal(selectionToolbar.text);
    setShowQuoteModal(true);
    window.getSelection()?.removeAllRanges();
    setSelectionToolbar(null);
  };

  const handleJumpTo = (targetChapterId: string, targetBlockId: string) => {
    if (targetChapterId !== chapter.chapter_id) {
      pendingJumpBlockIdRef.current = targetBlockId;
      onSelectChapter(targetChapterId);
    } else {
      const el = blockRefs.current.get(targetBlockId) || document.getElementById(`block-${targetBlockId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Helper to render paragraph with highlighted spans
  const renderHighlightedText = (rawText: string, blockId: string) => {
    const text = sanitizeReaderText(rawText);
    const blockHighlights = highlights.filter((h) => h.block_id === blockId);
    if (blockHighlights.length === 0) return text;

    type MatchSegment = { start: number; end: number; color: HighlightColor };
    const matches: MatchSegment[] = [];

    for (const hl of blockHighlights) {
      if (!hl.selected_text) continue;
      let pos = 0;
      while ((pos = text.indexOf(hl.selected_text, pos)) !== -1) {
        matches.push({
          start: pos,
          end: pos + hl.selected_text.length,
          color: hl.color
        });
        pos += hl.selected_text.length;
      }
    }

    if (matches.length === 0) return text;

    matches.sort((a, b) => a.start - b.start);

    const cleanMatches: MatchSegment[] = [];
    let maxEnd = 0;
    for (const m of matches) {
      if (m.start >= maxEnd) {
        cleanMatches.push(m);
        maxEnd = m.end;
      }
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    const colorClasses: Record<HighlightColor, string> = {
      yellow: 'bg-amber-300/60 dark:bg-amber-400/35 rounded-xs px-0.5 transition-colors',
      green: 'bg-emerald-300/60 dark:bg-emerald-400/35 rounded-xs px-0.5 transition-colors',
      amber: 'bg-orange-300/60 dark:bg-orange-400/35 rounded-xs px-0.5 transition-colors',
      rose: 'bg-rose-300/60 dark:bg-rose-400/35 rounded-xs px-0.5 transition-colors'
    };

    cleanMatches.forEach((m, idx) => {
      if (m.start > cursor) {
        parts.push(text.slice(cursor, m.start));
      }
      parts.push(
        <mark
          key={`hl-${blockId}-${idx}-${m.start}`}
          className={`${colorClasses[m.color] || colorClasses.yellow} text-inherit`}
        >
          {text.slice(m.start, m.end)}
        </mark>
      );
      cursor = m.end;
    });

    if (cursor < text.length) {
      parts.push(text.slice(cursor));
    }

    return parts;
  };

  // Audio Read-Along sequence handler
  const handleToggleTTS = () => {
    if (isSpeaking) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
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

    const blockElement = blockRefs.current.get(block.id);
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    play(block.id, sanitizeReaderText(block.text), () => {
      startSpeakingBlock(index + 1);
    });
  };

  const handleStopTTS = () => {
    stop();
    setCurrentBlockIndex(0);
  };

  // Center Tap toggles Zen mode
  const handleContentTap = (e: React.MouseEvent) => {
    // If text was selected or link/button clicked, do not toggle chrome
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('mark')) return;

    const height = window.innerHeight;
    const y = e.clientY;

    if (y > height * 0.2 && y < height * 0.8) {
      setShowChrome((prev) => !prev);
    }
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContentTap}
      onMouseUp={handleSelection}
      onTouchEnd={handleSelection}
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
          <div className="truncate max-w-[180px] sm:max-w-md">
            <h2 className="text-sm font-bold truncate leading-tight font-hindi-serif">
              {book.title}
            </h2>
            <p className="text-[11px] opacity-60 truncate">{chapter.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNotebook(true)}
            className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative"
            title="मेरी नोटबुक (Highlights & Bookmarks)"
          >
            <Bookmark className="w-5 h-5 text-amber-500" />
            {highlights.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
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
                id={`block-${block.id}`}
                data-block-id={block.id}
                ref={(el) => {
                  if (el) blockRefs.current.set(block.id, el);
                  else blockRefs.current.delete(block.id);
                }}
                className={`transition-all duration-200 select-text ${
                  isActiveTTS ? 'active-tts-block' : ''
                }`}
                style={{
                  fontSize: `${settings.fontSize}px`,
                  lineHeight: settings.lineHeight
                }}
              >
                {block.type === 'quote' ? (
                  <blockquote className="border-l-4 border-[#C05621] pl-4 italic opacity-95 my-4">
                    {renderHighlightedText(block.text, block.id)}
                  </blockquote>
                ) : block.type === 'h2' ? (
                  <h3 className="font-bold font-serif text-lg my-4 opacity-95">
                    {renderHighlightedText(block.text, block.id)}
                  </h3>
                ) : (
                  <p
                    className="cursor-pointer"
                    onClick={(e) => {
                      if (isSpeaking) {
                        e.stopPropagation();
                        startSpeakingBlock(index);
                      }
                    }}
                  >
                    {renderHighlightedText(block.text, block.id)}
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

      {/* Selection Toolbar Floating Pill */}
      <SelectionToolbar
        position={selectionToolbar?.position || null}
        selectedText={selectionToolbar?.text || ''}
        onHighlight={handleHighlight}
        onBookmark={handleBookmark}
        onOpenQuoteCard={handleOpenQuoteCard}
        onClose={() => setSelectionToolbar(null)}
      />

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

      {/* Modals & Drawers */}
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

      <NotebookDrawer
        isOpen={showNotebook}
        onClose={() => setShowNotebook(false)}
        bookId={book.id}
        onJumpTo={handleJumpTo}
      />

      <QuoteCardModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        quoteText={quoteTextForModal}
        bookTitle={book.title}
        author={book.author}
      />
    </div>
  );
};


