import { useState } from 'react';
import { TTS_MODEL, TTS_VOICE } from '@/constants';
import { callOpenAITTS } from '@/lib/openai';

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const play = async (text: string) => {
    if (!text || isPlaying) return;
    setIsPlaying(true);
    try {
      const cleanText = text.replace(/[#*`]/g, '').substring(0, 4096);
      const blob = await callOpenAITTS(cleanText, TTS_MODEL, TTS_VOICE);
      const audio = new Audio(URL.createObjectURL(blob));
      audio.onended = () => setIsPlaying(false);
      await audio.play();
    } catch (err) {
      console.error(err);
      setIsPlaying(false);
    }
  };

  return { isPlaying, play };
}
