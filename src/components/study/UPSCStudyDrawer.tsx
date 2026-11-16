import React, { useState } from 'react';
import {
  X,
  GraduationCap,
  BookOpen,
  HelpCircle,
  Quote,
  Sparkles,
  BookmarkPlus,
  CheckCircle2,
  Award
} from 'lucide-react';
import type { UPSCBookInfo, UPSCAnnotation, UPSCQuote } from '../../data/upscData';
import { db } from '../../db';

interface UPSCStudyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  upscInfo: UPSCBookInfo;
  chapterId: string;
  chapterTitle: string;
  activeAnnotationId?: string | null;
  onSelectAnnotation?: (annotation: UPSCAnnotation) => void;
}

export const UPSCStudyDrawer: React.FC<UPSCStudyDrawerProps> = ({
  isOpen,
  onClose,
  upscInfo,
  chapterId,
  chapterTitle,
  activeAnnotationId,
  onSelectAnnotation
}) => {
  const [activeTab, setActiveTab] = useState<'vyakhya' | 'pyq' | 'quotes' | 'syllabus'>('vyakhya');
  const [savedQuoteIndexes, setSavedQuoteIndexes] = useState<Set<number>>(new Set());

  if (!isOpen) return null;

  // Filter annotations for current chapter
  const chapterAnnotations = upscInfo.annotations.filter((a) => a.chapterId === chapterId);
  const selectedAnnotation =
    chapterAnnotations.find((a) => a.id === activeAnnotationId) ||
    chapterAnnotations[0] ||
    null;

  const handleSaveQuoteToNotebook = async (quote: UPSCQuote, idx: number) => {
    try {
      await db.bookmarks.add({
        book_id: upscInfo.id,
        chapter_id: chapterId,
        block_id: 'upsc_quote_' + idx,
        snippet: `[UPSC कोट] "${quote.quote}" — ${quote.speakerOrContext} (${upscInfo.id})`,
        created_at: Date.now()
      });
      setSavedQuoteIndexes((prev) => new Set(prev).add(idx));
    } catch (err) {
      console.error('Failed to save UPSC quote:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-lg bg-[#FAF8F5] text-[#1F1916] h-full shadow-2xl flex flex-col z-10 border-l border-[#231A15]/15 transition-transform duration-300">
        {/* Drawer Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#241A14] via-[#35251C] to-[#1E140F] text-[#FAF5E8] flex items-center justify-between border-b border-amber-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm font-hindi-serif leading-tight">
                  हर्फ़ अध्ययन मित्र
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-amber-950 uppercase">
                  UPSC / PCS
                </span>
              </div>
              <p className="text-[11px] text-[#FAF5E8]/70 truncate max-w-[260px]">
                {upscInfo.paper} • {upscInfo.paperSection}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Syllabus Scope & Importance Strip */}
        <div className="bg-amber-100/60 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between text-xs font-semibold text-amber-950">
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            <span>{upscInfo.importance}</span>
          </span>
          <span className="text-[11px] text-amber-800/80 font-normal">
            पाठ्यक्रम: {upscInfo.syllabusScope}
          </span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#231A15]/10 bg-white/50 px-2 pt-2 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('vyakhya')}
            className={`flex-1 py-2.5 px-2 rounded-t-xl transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'vyakhya'
                ? 'bg-white border-[#C85A32] text-[#C85A32] shadow-2xs'
                : 'border-transparent text-[#1F1916]/60 hover:text-[#1F1916]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>सप्रसंग व्याख्या</span>
            {chapterAnnotations.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#C85A32] text-white text-[10px] flex items-center justify-center">
                {chapterAnnotations.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('pyq')}
            className={`flex-1 py-2.5 px-2 rounded-t-xl transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'pyq'
                ? 'bg-white border-[#C85A32] text-[#C85A32] shadow-2xs'
                : 'border-transparent text-[#1F1916]/60 hover:text-[#1F1916]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>PYQs ({upscInfo.pyqs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex-1 py-2.5 px-2 rounded-t-xl transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'quotes'
                ? 'bg-white border-[#C85A32] text-[#C85A32] shadow-2xs'
                : 'border-transparent text-[#1F1916]/60 hover:text-[#1F1916]'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
            <span>उद्धरण ({upscInfo.quotes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('syllabus')}
            className={`flex-1 py-2.5 px-2 rounded-t-xl transition-all flex items-center justify-center gap-1.5 border-b-2 ${
              activeTab === 'syllabus'
                ? 'bg-white border-[#C85A32] text-[#C85A32] shadow-2xs'
                : 'border-transparent text-[#1F1916]/60 hover:text-[#1F1916]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>थीम्स</span>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* TAB 1: सप्रसंग व्याख्या */}
          {activeTab === 'vyakhya' && (
            <div className="space-y-4">
              {chapterAnnotations.length > 0 ? (
                <>
                  {/* Annotation Selector if multiple in this chapter */}
                  {chapterAnnotations.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {chapterAnnotations.map((ann, idx) => (
                        <button
                          key={ann.id}
                          onClick={() => onSelectAnnotation?.(ann)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                            selectedAnnotation?.id === ann.id
                              ? 'bg-[#C85A32] text-white shadow-xs'
                              : 'bg-black/5 hover:bg-black/10 text-[#1F1916]/70'
                          }`}
                        >
                          प्रसंग {idx + 1}: {ann.title.slice(0, 16)}...
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedAnnotation && (
                    <div className="space-y-4">
                      {/* Title & PYQ Reference Tag */}
                      <div className="bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-bold text-[#C85A32] uppercase tracking-wider">
                            परीक्षा उपयोगी प्रसंग
                          </span>
                          {selectedAnnotation.pyqRef && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                              {selectedAnnotation.pyqRef}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-base font-serif text-[#1F1916]">
                          {selectedAnnotation.title}
                        </h4>
                      </div>

                      {/* 1. संदर्भ व प्रसंग (Context) */}
                      <div className="bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-xs">
                        <h5 className="font-bold text-xs font-serif uppercase tracking-wider text-[#C85A32] mb-1.5 flex items-center gap-1">
                          <span>📌 संदर्भ एवं प्रसंग</span>
                        </h5>
                        <p className="text-xs sm:text-sm leading-relaxed text-[#1F1916]/85 font-hindi-serif">
                          {selectedAnnotation.context}
                        </p>
                      </div>

                      {/* 2. भावार्थ व व्याख्या (Explanation) */}
                      <div className="bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-xs">
                        <h5 className="font-bold text-xs font-serif uppercase tracking-wider text-[#C85A32] mb-1.5 flex items-center gap-1">
                          <span>📝 भावार्थ एवं साहित्यिक व्याख्या</span>
                        </h5>
                        <p className="text-xs sm:text-sm leading-relaxed text-[#1F1916]/85 font-hindi-serif">
                          {selectedAnnotation.explanation}
                        </p>
                      </div>

                      {/* 3. विशेष / परीक्षा-उपयोगी टिप्पणियाँ (Vishesh) */}
                      {selectedAnnotation.vishesh && selectedAnnotation.vishesh.length > 0 && (
                        <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200 shadow-xs">
                          <h5 className="font-bold text-xs font-serif uppercase tracking-wider text-amber-900 mb-2 flex items-center gap-1">
                            <span>⭐ विशेष (UPSC परीक्षा अंक-प्रदायक बिंदु)</span>
                          </h5>
                          <ul className="space-y-1.5 text-xs text-amber-950/90 font-hindi-serif">
                            {selectedAnnotation.vishesh.map((item, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 4. क्लिष्ट शब्दार्थ (Glossary) */}
                      {selectedAnnotation.glossary && selectedAnnotation.glossary.length > 0 && (
                        <div className="bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-xs">
                          <h5 className="font-bold text-xs font-serif uppercase tracking-wider text-[#1F1916]/70 mb-2">
                            📖 क्लिष्ट शब्दार्थ (Glossary)
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {selectedAnnotation.glossary.map((g, i) => {
                              const word = typeof g === 'string' ? g.split(':')[0]?.trim() : g.word;
                              const meaning = typeof g === 'string' ? g.split(':').slice(1).join(':').trim() : g.meaning;
                              return (
                                <div
                                  key={i}
                                  className="p-2 rounded-xl bg-black/5 flex items-baseline justify-between gap-2"
                                >
                                  <span className="font-bold text-[#C85A32] font-serif">{word}</span>
                                  <span className="text-[#1F1916]/75 text-[11px] text-right">{meaning}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 bg-white rounded-2xl p-5 border border-[#231A15]/10">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-sm text-[#1F1916] mb-1">
                    {chapterTitle}
                  </h4>
                  <p className="text-xs text-[#1F1916]/70 leading-relaxed max-w-sm mx-auto mb-4 font-hindi-serif">
                    इस विशिष्ट अध्याय के लिए सामान्य पठन जारी रखें। पाठ्यक्रम के प्रमुख प्रश्नों (PYQs) और उत्तर-लेखन उद्धरणों के लिए ऊपर दिए गए टैब देखें।
                  </p>
                  <button
                    onClick={() => setActiveTab('pyq')}
                    className="px-4 py-2 rounded-xl bg-[#231814] text-[#FAF5E8] text-xs font-bold transition-all shadow-xs"
                  >
                    इस पुस्तक के PYQs देखें ({upscInfo.pyqs.length}) →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: पूछे गए प्रश्न (PYQs) */}
          {activeTab === 'pyq' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1F1916]/60 uppercase tracking-wider">
                  विगत वर्षों के मुख्य परीक्षा प्रश्न ({upscInfo.pyqs.length})
                </span>
                <span className="text-[11px] font-medium text-[#C85A32]">
                  UPSC CSE & State PCS
                </span>
              </div>

              {upscInfo.pyqs.length > 0 ? (
                upscInfo.pyqs.map((pyq, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                        {pyq.exam} {pyq.year} • {pyq.paper}
                      </span>
                      {pyq.marks && (
                        <span className="text-[11px] font-semibold text-[#1F1916]/60">
                          {pyq.marks} अंक
                        </span>
                      )}
                    </div>

                    <p className="font-serif font-bold text-sm text-[#1F1916] leading-relaxed">
                      {pyq.question}
                    </p>

                    {/* Answer Framework Dimensions */}
                    {pyq.dimensions && pyq.dimensions.length > 0 && (
                      <div className="pt-2 border-t border-[#231A15]/8">
                        <span className="text-[11px] font-bold text-[#C85A32] uppercase tracking-wider block mb-1">
                          उत्तर-लेखन के मुख्य आयाम (Model Framework):
                        </span>
                        <ul className="space-y-1 text-xs text-[#1F1916]/80 font-hindi-serif">
                          {pyq.dimensions.map((dim, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-1.5">
                              <span className="text-[#C85A32] font-bold">✓</span>
                              <span>{dim}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Key Quotes to Cite */}
                    {pyq.keyQuotes && pyq.keyQuotes.length > 0 && (
                      <div className="pt-2 border-t border-[#231A15]/8 bg-amber-50/50 p-2.5 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block mb-1">
                          उत्तर में प्रयुक्त करने योग्य उद्धरण:
                        </span>
                        <div className="space-y-1 text-xs italic text-amber-950 font-hindi-serif">
                          {pyq.keyQuotes.map((kq, qIdx) => (
                            <p key={qIdx}>“{kq}”</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 bg-white rounded-2xl p-5 border border-[#231A15]/10">
                  <p className="text-xs text-[#1F1916]/60">
                    इस पुस्तक से संबंधित PYQ संकलन प्रक्रियाधीन है।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: उद्धरण बैंक (Quote Deck) */}
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1F1916]/60 uppercase tracking-wider">
                  उत्तर-लेखन उद्धरण बैंक (Quote Deck)
                </span>
                <span className="text-[11px] text-[#1F1916]/50">
                  1-क्लिक में नोटबुक में सहेजें
                </span>
              </div>

              {upscInfo.quotes.length > 0 ? (
                upscInfo.quotes.map((q, idx) => {
                  const isSaved = savedQuoteIndexes.has(idx);

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C85A32]/10 text-[#C85A32]">
                          थीम: {q.theme}
                        </span>
                        <button
                          onClick={() => handleSaveQuoteToNotebook(q, idx)}
                          disabled={isSaved}
                          className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                            isSaved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-black/5 hover:bg-black/10 text-[#1F1916]/80'
                          }`}
                        >
                          {isSaved ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>सहेजा गया</span>
                            </>
                          ) : (
                            <>
                              <BookmarkPlus className="w-3.5 h-3.5 text-[#C85A32]" />
                              <span>नोटबुक में जोड़ें</span>
                            </>
                          )}
                        </button>
                      </div>

                      <blockquote className="border-l-3 border-[#C85A32] pl-3 py-0.5 text-sm font-bold font-serif text-[#1F1916] leading-relaxed">
                        “{q.quote}”
                      </blockquote>

                      <div className="text-[11px] text-[#1F1916]/60 flex items-center justify-between">
                        <span>प्रसंग: {q.speakerOrContext}</span>
                      </div>

                      <p className="text-xs text-[#1F1916]/75 bg-black/3 p-2 rounded-xl font-hindi-serif">
                        <strong className="text-[#1F1916]">महत्व:</strong> {q.significance}
                      </p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 bg-white rounded-2xl p-5 border border-[#231A15]/10">
                  <p className="text-xs text-[#1F1916]/60">
                    इस पुस्तक के उद्धरण संकलन की प्रक्रिया जारी है।
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: थीम्स व परीक्षा सारांश */}
          {activeTab === 'syllabus' && (
            <div className="space-y-4">
              {/* Exam Summary Box */}
              <div className="bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-[#C85A32] uppercase tracking-wider block">
                  परीक्षा दृष्टि से त्वरित सारांश (Exam Takeaway)
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-[#1F1916]/85 font-hindi-serif">
                  {upscInfo.summaryForExam}
                </p>
              </div>

              {/* Core Themes Pills */}
              <div className="bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-xs space-y-2.5">
                <span className="text-xs font-bold text-[#1F1916]/70 uppercase tracking-wider block">
                  प्रमुख परीक्षा थीम्स (Core Dimensions)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {upscInfo.coreThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-xl bg-amber-100/70 text-amber-950 text-xs font-semibold border border-amber-300/40"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>

              {/* Syllabus Classification Card */}
              <div className="bg-white rounded-2xl p-4 border border-[#231A15]/10 shadow-xs space-y-2 text-xs">
                <span className="text-xs font-bold text-[#1F1916]/70 uppercase tracking-wider block">
                  पाठ्यक्रम वर्गीकरण
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-black/5">
                    <span className="text-[10px] text-[#1F1916]/50 block">प्रश्न पत्र</span>
                    <span className="font-bold text-[#1F1916]">{upscInfo.paper}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/5">
                    <span className="text-[10px] text-[#1F1916]/50 block">खंड</span>
                    <span className="font-bold text-[#1F1916]">{upscInfo.paperSection}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/5 col-span-2">
                    <span className="text-[10px] text-[#1F1916]/50 block">श्रेणी व दायरा</span>
                    <span className="font-bold text-[#1F1916]">
                      {upscInfo.syllabusCategory} ({upscInfo.syllabusScope})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
