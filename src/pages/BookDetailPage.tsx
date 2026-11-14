import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Download,
  CheckCircle2,
  Trash2,
  Calendar,
  Share2
} from 'lucide-react';
import { useBook } from '../hooks/useBook';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { downloadBookOffline, removeBookOffline, isBookOffline } from '../utils/storage';
import { BookCover } from '../components/library/BookCover';

export const BookDetailPage: React.FC = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const { book, loading, error } = useBook(bookId || '');
  const { progress } = useReadingProgress(bookId);

  const [isOffline, setIsOffline] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgressText, setDownloadProgressText] = useState('');

  useEffect(() => {
    if (book) {
      isBookOffline(book.id, book.total_chapters).then(setIsOffline);
    }
  }, [book]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#1F1916] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold font-serif mb-2">पुस्तक उपलब्ध नहीं है</h2>
        <p className="text-sm opacity-70 mb-4">{error || 'जानकारी नहीं मिल सकी'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-[#231814] text-[#FAF5E8] text-xs font-bold"
        >
          होम पर जाएँ
        </button>
      </div>
    );
  }

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadProgressText('आरंभ हो रहा है...');

    const success = await downloadBookOffline(book.id, (current, total) => {
      setDownloadProgressText(`अध्याय ${current}/${total}`);
    });

    setDownloading(false);
    if (success) {
      setIsOffline(true);
    }
  };

  const handleRemoveOffline = async () => {
    if (confirm('क्या आप इस पुस्तक को ऑफ़लाइन मेमोरी से हटाना चाहते हैं?')) {
      await removeBookOffline(book.id);
      setIsOffline(false);
    }
  };

  const startChapterId = progress?.chapter_id || book.chapters[0]?.id || 'ch_01';

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1916]">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-[#FAF7F2]/90 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between border-b border-[#231A15]/8">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl hover:bg-black/5 active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `${book.title} — ${book.author}`,
                text: `${book.title} - हर्फ़ पर मुफ़्त में पढ़ें।`,
                url: window.location.href
              });
            }
          }}
          className="p-2 rounded-xl hover:bg-black/5 transition-colors"
          title="साझा करें (Share)"
        >
          <Share2 className="w-5 h-5 text-[#1F1916]/70" />
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Book Header Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mb-10 text-center sm:text-left">
          {/* 3D Book Cover Presentation */}
          <div className="shrink-0 transform hover:scale-105 transition-transform duration-300">
            <BookCover
              id={book.id}
              title={book.title}
              author={book.author}
              category={book.category}
              size="hero"
            />
          </div>

          {/* Book Metadata & Description */}
          <div className="flex-1">
            <Link
              to={`/?category=${encodeURIComponent(book.category)}`}
              className="inline-block px-3 py-1 rounded-full bg-[#C85A32]/10 hover:bg-[#C85A32]/20 text-[11px] font-bold text-[#C85A32] mb-2 uppercase tracking-wider transition-colors"
            >
              {book.category} • {book.category_en}
            </Link>

            <h1 className="text-3xl sm:text-4xl font-black font-serif leading-tight">
              {book.title}
            </h1>
            <p className="text-sm font-medium text-[#1F1916]/50 mt-0.5">
              {book.title_en}
            </p>

            <Link
              to={`/?author=${encodeURIComponent(book.author)}`}
              className="text-lg font-bold text-[#C85A32] hover:underline mt-2 font-hindi-serif inline-block"
            >
              {book.author}{' '}
              <span className="text-xs font-normal text-[#1F1916]/60">({book.author_en})</span>
            </Link>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#1F1916]/70 mt-3 font-medium">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-[#C85A32]" />
                <span>{book.total_chapters} अध्याय</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-[#C85A32]" />
                <span>~{book.estimated_reading_minutes} मिनट का पठन</span>
              </div>
              {book.published_year && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-[#C85A32]" />
                  <span>प्रकाशन: {book.published_year}</span>
                </div>
              )}
            </div>

            {/* Action CTAs */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-6">
              <Link
                to={`/read/${book.id}/${startChapterId}`}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#231814] to-[#3B2922] text-[#FAF5E8] font-bold text-sm shadow-md hover:brightness-110 transition-all active:scale-95 flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-[#E08E45]" />
                <span>{progress ? 'पठन जारी रखें' : 'पहला अध्याय पढ़ें'}</span>
              </Link>

              {isOffline ? (
                <button
                  onClick={handleRemoveOffline}
                  className="px-4 py-3 rounded-2xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-2 hover:bg-emerald-200 transition-colors shadow-2xs"
                  title="ऑफ़लाइन मेमोरी से हटाएँ"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>ऑफ़लाइन उपलब्ध</span>
                  <Trash2 className="w-3.5 h-3.5 opacity-60 ml-1 hover:text-red-600" />
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="px-4 py-3 rounded-2xl bg-white hover:bg-white/80 text-[#1F1916] border border-[#231A15]/15 text-xs font-bold flex items-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[#C85A32]" />
                  <span>{downloading ? downloadProgressText : 'ऑफ़लाइन सहेजें'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Synopsis / Blurb */}
        <section className="bg-white/70 rounded-3xl p-6 border border-[#231A15]/10 mb-8 shadow-xs">
          <h3 className="font-bold text-base font-serif mb-2 text-[#1F1916]">
            पुस्तक परिचय (Synopsis)
          </h3>
          <p className="text-sm leading-relaxed text-[#1F1916]/80 font-hindi-serif">
            {book.description}
          </p>
        </section>

        {/* Chapters Table of Contents */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg font-serif">अनुक्रमणिका (Chapters)</h3>
            <span className="text-xs text-[#1F1916]/60">{book.total_chapters} भाग</span>
          </div>

          <div className="bg-white/70 rounded-2xl border border-[#231A15]/10 divide-y divide-[#231A15]/5 overflow-hidden shadow-xs">
            {book.chapters.map((ch) => (
              <Link
                key={ch.id}
                to={`/read/${book.id}/${ch.id}`}
                className="flex items-center justify-between p-4 hover:bg-[#231A15]/5 transition-colors group"
              >
                <div>
                  <h4 className="font-bold text-sm text-[#1F1916] group-hover:text-[#C85A32] transition-colors">
                    {ch.title}
                  </h4>
                  <p className="text-xs text-[#1F1916]/50 mt-0.5">
                    {ch.word_count} शब्द • ~{ch.estimated_minutes} मिनट
                  </p>
                </div>
                <span className="text-xs font-bold text-[#C85A32] opacity-0 group-hover:opacity-100 transition-opacity">
                  पढ़ें →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
