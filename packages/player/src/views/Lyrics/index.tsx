import { FC, useEffect, useRef, useState } from 'react';

import { useQueueStore } from '../../stores/queueStore';
import { useSoundStore } from '../../stores/soundStore';

type SyncedLine = { time: number; text: string };
type CachedLyrics = {
  syncedLines: SyncedLine[] | null;
  plainLyrics: string | null;
  source: string | null;
};

// Caché global (vive fuera del componente, no se borra al cambiar de tab)
const lyricsCache: Record<string, CachedLyrics> = {};

const fetchFromLrclib = async (artist: string, title: string) => {
  const res = await fetch(
    `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`,
  );
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return {
      synced: data[0].syncedLyrics ?? null,
      plain: data[0].plainLyrics ?? null,
    };
  }
  return { synced: null, plain: null };
};

const fetchFromLyricsOvh = async (artist: string, title: string) => {
  const res = await fetch(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
  );
  const data = await res.json();
  return data.lyrics ?? null;
};

const parseLRC = (lrc: string): SyncedLine[] => {
  const lines = lrc.split('\n');
  const result: SyncedLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;
  for (const line of lines) {
    let match;
    const text = line.replace(/\[(\d{2}):(\d{2})\.(\d{2,3})\]/g, '').trim();
    regex.lastIndex = 0;
    while ((match = regex.exec(line)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = parseInt(match[3].padEnd(3, '0'), 10);
      const time = min * 60 + sec + ms / 1000;
      result.push({ time, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
};

export const LyricsView: FC = () => {
  const currentItem = useQueueStore((s) => s.getCurrentItem());
  const track = currentItem?.track;
  const seek = useSoundStore((s) => s.seek);
  const seekTo = useSoundStore((s) => s.seekTo);

  const [syncedLines, setSyncedLines] = useState<SyncedLine[] | null>(null);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!track) {
      return;
    }
    const artist = track.artists[0]?.name ?? '';
    const title = track.title ?? '';
    const cacheKey = `${artist} - ${title}`;

    // Si ya está en caché, usarlo de inmediato (sin buscar)
    const cached = lyricsCache[cacheKey];
    if (cached) {
      setSyncedLines(cached.syncedLines);
      setPlainLyrics(cached.plainLyrics);
      setSource(cached.source);
      setLoading(false);
      return;
    }

    setSyncedLines(null);
    setPlainLyrics(null);
    setSource(null);
    setLoading(true);

    const search = async () => {
      let resultSynced: SyncedLine[] | null = null;
      let resultPlain: string | null = null;
      let resultSource: string | null = null;

      try {
        const { synced, plain } = await fetchFromLrclib(artist, title);
        if (synced) {
          resultSynced = parseLRC(synced);
          resultSource = 'lrclib.net (synced)';
        } else if (plain) {
          resultPlain = plain;
          resultSource = 'lrclib.net';
        }
      } catch {
        /* ignore */
      }

      if (!resultSynced && !resultPlain) {
        try {
          const result = await fetchFromLyricsOvh(artist, title);
          if (result) {
            resultPlain = result;
            resultSource = 'lyrics.ovh';
          }
        } catch {
          /* ignore */
        }
      }

      // Guardar en caché (incluso si no se encontró, para no re-buscar en vano)
      lyricsCache[cacheKey] = {
        syncedLines: resultSynced,
        plainLyrics: resultPlain,
        source: resultSource,
      };

      setSyncedLines(resultSynced);
      setPlainLyrics(resultPlain);
      setSource(resultSource);
    };
    search().finally(() => setLoading(false));
  }, [track?.source?.id]);

  const activeIndex = syncedLines
    ? syncedLines.reduce((acc, line, i) => (seek >= line.time ? i : acc), -1)
    : -1;

  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const line = activeLineRef.current;
      const offset =
        line.offsetTop -
        container.offsetTop -
        container.clientHeight / 2 +
        line.clientHeight / 2;
      container.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }, [activeIndex]);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem 1rem',
        boxSizing: 'border-box',
      }}
    >
      {track && (
        <div
          style={{ textAlign: 'center', marginBottom: '1rem', flexShrink: 0 }}
        >
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{track.title}</h2>
          <p style={{ margin: '0.25rem 0', opacity: 0.6 }}>
            {track.artists[0]?.name}
          </p>
          {source && (
            <p style={{ margin: 0, opacity: 0.35, fontSize: '0.7rem' }}>
              {source}
            </p>
          )}
        </div>
      )}

      {!track && (
        <p style={{ textAlign: 'center', opacity: 0.6 }}>
          No hay ninguna canción reproduciéndose.
        </p>
      )}
      {track && loading && (
        <p style={{ textAlign: 'center', opacity: 0.6 }}>Buscando letra...</p>
      )}
      {track && !loading && !syncedLines && !plainLyrics && (
        <p style={{ textAlign: 'center', opacity: 0.6 }}>
          No se encontró la letra de "{track.title}".
        </p>
      )}

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          maxWidth: '700px',
          width: '100%',
          margin: '0 auto',
          textAlign: 'center',
          maskImage:
            'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent, black 12%, black 88%, transparent)',
        }}
      >
        {syncedLines && (
          <div style={{ padding: '40vh 0' }}>
            {syncedLines.map((line, i) => {
              const isActive = i === activeIndex;
              return (
                <p
                  key={i}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => seekTo(line.time)}
                  style={{
                    fontSize: isActive ? '2rem' : '1.5rem',
                    fontWeight: isActive ? 700 : 500,
                    opacity: isActive ? 1 : 0.35,
                    color: isActive ? 'var(--accent, #ff8fa3)' : 'inherit',
                    transition: 'all 0.3s ease',
                    margin: '1.2rem 0',
                    cursor: 'pointer',
                    lineHeight: 1.3,
                  }}
                >
                  {line.text || '♪'}
                </p>
              );
            })}
          </div>
        )}

        {!syncedLines && plainLyrics && (
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 2,
              fontFamily: 'inherit',
              fontSize: '1.4rem',
              margin: 0,
              paddingBottom: '20vh',
            }}
          >
            {plainLyrics}
          </pre>
        )}
      </div>
    </div>
  );
};
