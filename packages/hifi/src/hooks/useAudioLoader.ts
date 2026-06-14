import { RefObject, useEffect, useRef } from 'react';

import { AudioSource } from '../types';

export const useAudioLoader = (
  audioRef: RefObject<HTMLAudioElement | null>,
  src: AudioSource,
  isReady: boolean,
) => {
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (src.protocol === 'hls' || src.protocol === 'mse') {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (src.url !== prevUrl.current) {
      // Limpiar el audio anterior antes de cargar el nuevo,
      // para que no suene un cachito de la canción previa.
      audio.pause();
      audio.currentTime = 0;
      audio.src = src.url;
      audio.load();
      prevUrl.current = src.url;
    }
  }, [src, isReady, audioRef]);
};
