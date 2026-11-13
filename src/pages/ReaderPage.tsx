import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBook, useChapter } from '../hooks/useBook';
import { ReaderView } from '../components/reader/ReaderView';

export const ReaderPage: React.FC = () => {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();

  const { book, loading: bookLoading, error: bookError } = useBook(bookId || '');
  const { chapter, loading: chLoading, error: chError } = useChapter(
    bookId || '',
    chapterId || 'ch_01'
  );

  if (bookLoading || chLoading) {
    return (
      <div className="min-h-screen bg-[#FBF0D9] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#2C221E] border-t-transparent animate-spin" />
        <p className="text-xs text-[#2C221E]/60 font-medium">अध्याय लोड हो रहा है...</p>
      </div>
    );
  }

  if (bookError || chError || !book || !chapter) {
    return (
      <div className="min-h-screen bg-[#FBF0D9] p-6 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-bold font-serif mb-2">अध्याय उपलब्ध नहीं है</h2>
        <p className="text-sm opacity-70 mb-4">{chError || bookError || 'लोड नहीं हो सका'}</p>
        <button
          onClick={() => navigate(bookId ? `/book/${bookId}` : '/')}
          className="px-4 py-2 rounded-xl bg-[#2C221E] text-[#FBF0D9] text-xs font-bold"
        >
          वापस जाएँ
        </button>
      </div>
    );
  }

  const handleSelectChapter = (newChapterId: string) => {
    navigate(`/read/${book.id}/${newChapterId}`);
  };

  return (
    <ReaderView
      book={book}
      chapter={chapter}
      onSelectChapter={handleSelectChapter}
    />
  );
};
