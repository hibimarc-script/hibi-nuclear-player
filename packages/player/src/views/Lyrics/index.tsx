import { FC, useEffect, useState } from 'react';

import { useQueueStore } from '../../stores/queueStore';

const fetchFromLyricsOvh = async (artist: string, title: string) => {
  const res = await fetch(
    `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
  );
  const data = await res.json();
  return data.lyrics ?? null;
};

const fetchFromLrclib = async (artist: string, title: string) => {
  const res = await fetch(
    `https://lrclib.net/api/search?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`,
  );
  const data = await res.json();
  if (Array.isArray(data) && data.length > 0) {
    return data[0].plainLyrics ?? null;
  }
  return null;
};

export const LyricsView: FC = () => {
  const currentItem = useQueueStore((s) => s.getCurrentItem());
  const track = currentItem?.track;
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    if (!track) {
      return;
    }
    const artist = track.artists[0]?.name ?? '';
    const title = track.title ?? '';
    setLyrics(null);
    setSource(null);
    setLoading(true);

    const search = async () => {
      try {
        const result1 = await fetchFromLyricsOvh(artist, title);
        if (result1) {
          setLyrics(result1);
          setSource('lyrics.ovh');
          return;
        }
      } catch {
        /* ignore */
      }
      try {
        const result2 = await fetchFromLrclib(artist, title);
        if (result2) {
          setLyrics(result2);
          setSource('lrclib.net');
          return;
        }
      } catch {
        /* ignore */
      }
      setLyrics(null);
    };

    search().finally(() => setLoading(false));
  }, [track?.source?.id]);

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      {!track && (
        <p style={{ color: 'var(--text-secondary)' }}>
          No hay ninguna canción reproduciéndose.
        </p>
      )}
      {track && loading && (
        <p style={{ color: 'var(--text-secondary)' }}>Buscando letra...</p>
      )}
      {track && !loading && !lyrics && (
        <p style={{ color: 'var(--text-secondary)' }}>
          No se encontró la letra de "{track.title}".
        </p>
      )}
      {track && !loading && lyrics && (
        <>
          <h2 style={{ marginBottom: '0.5rem' }}>{track.title}</h2>
          <p style={{ marginBottom: '0.25rem', opacity: 0.6 }}>
            {track.artists[0]?.name}
          </p>
          {source && (
            <p
              style={{
                marginBottom: '1.5rem',
                opacity: 0.4,
                fontSize: '0.75rem',
              }}
            >
              Fuente: {source}
            </p>
          )}
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.8,
              fontFamily: 'inherit',
            }}
          >
            {lyrics}
          </pre>
        </>
      )}
    </div>
  );
};
