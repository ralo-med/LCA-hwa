import { useState } from 'react';
import { isGeminiConfigured, TTS_MODEL } from '@/constants';
import { callGemini, extractInlineData } from '@/lib/gemini';
import { pcmToWavBlob } from '@/lib/tts';

export function useTTS() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const play = async (text: string) => {
    if (!text || isPlaying) return;
    if (!isGeminiConfigured()) return;
    setIsPlaying(true);
    try {
      const cleanText = text.replace(/[#*`]/g, '');
      const ttsPrompt = `전문의의 따뜻하고 차분한 목소리로 읽어주세요: ${cleanText.substring(0, 800)}`;

      const data = await callGemini(`${TTS_MODEL}:generateContent`, {
        contents: [{ parts: [{ text: ttsPrompt }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      });

      const pcmBase64 = extractInlineData(data);
      if (!pcmBase64) throw new Error('No audio data received');

      const blob = pcmToWavBlob(pcmBase64);
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
