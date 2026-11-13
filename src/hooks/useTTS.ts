import { useState, useEffect, useRef, useCallback } from 'react';

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [hasHindiVoice, setHasHindiVoice] = useState(false);
  const currentVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const hindi = voices.find((v) => v.lang.startsWith('hi'));
      if (hindi) {
        currentVoiceRef.current = hindi;
        setHasHindiVoice(true);
      } else {
        // Fallback to any Indian English or default
        const indianEng = voices.find((v) => v.lang.includes('IN'));
        currentVoiceRef.current = indianEng || voices[0] || null;
        setHasHindiVoice(false);
      }
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
      setActiveBlockId(null);
    }
  }, []);

  const play = useCallback(
    (blockId: string, text: string, onEnded?: () => void) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        console.warn('SpeechSynthesis not supported');
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95; // Slightly slower for crisp Devanagari pronunciation
      utterance.pitch = 1.0;

      if (currentVoiceRef.current) {
        utterance.voice = currentVoiceRef.current;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setActiveBlockId(blockId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveBlockId(null);
        if (onEnded) onEnded();
      };

      utterance.onerror = (e) => {
        console.error('[TTS] Error:', e);
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveBlockId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const pause = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  return {
    isSpeaking,
    isPaused,
    activeBlockId,
    hasHindiVoice,
    play,
    pause,
    resume,
    stop
  };
}
