import { RefObject, useEffect, useRef } from 'react';

import { SoundStatus } from '../types';

const HAVE_FUTURE_DATA = 3;

const isReadyToPlay = (audio: HTMLAudioElement): boolean =>
  audio.readyState >= HAVE_FUTURE_DATA;

export const usePlaybackStatus = (
  audioRef: RefObject<HTMLAudioElement | null>,
  status: SoundStatus,
  srcUrl: string,
  context: AudioContext | null,
  isReady: boolean,
  onError?: (error: Error) => void,
) => {
  const activeSrcRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) {
      return;
    }
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const tryPlay = () => {
      if (!isReadyToPlay(audio)) {
        return;
      }
      if (!audio.paused) {
        return;
      }
      activeSrcRef.current = srcUrl;
      context?.resume();
      audio.play().then(undefined, (err: DOMException) => {
        if (err.name === 'AbortError') {
          return;
        }
        onError?.(err);
      });
    };

    switch (status) {
      case 'playing': {
        // Intentar reproducir siempre que el audio ya esté listo,
        // haya cambiado la fuente o no. Esto arregla el caso en que
        // el evento 'canplay' ya ocurrió antes de pasar a 'playing'
        // (canción en queue al iniciar, o recién instalado).
        tryPlay();
        const onCanPlay = () => tryPlay();
        audio.addEventListener('canplay', onCanPlay);
        return () => audio.removeEventListener('canplay', onCanPlay);
      }
      case 'paused': {
        audio.pause();
        return;
      }
      case 'stopped': {
        activeSrcRef.current = null;
        audio.pause();
        audio.currentTime = 0;
        return;
      }
    }
  }, [status, srcUrl, isReady, context, audioRef, onError]);
};
