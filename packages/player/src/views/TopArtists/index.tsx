import { useNavigate } from '@tanstack/react-router';
import { FC, useEffect, useState } from 'react';

import { useQueueStore } from '../../stores/queueStore';
import { useSoundStore } from '../../stores/soundStore';

const API_KEY = '4cfb44440a5c765c3c688835d95ac6fa';
const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f';

const isValidImage = (url?: string): boolean =>
  Boolean(url && url.trim() !== '' && !url.includes(LASTFM_PLACEHOLDER));

type Artist = {
  name: string;
  playcount: string;
  image: { '#text': string; size: string }[];
};

type RecentTrack = {
  name: string;
  artist: { '#text': string };
  image: { '#text': string; size: string }[];
  '@attr'?: { nowplaying: string };
};

export const TopArtistsView: FC = () => {
  const navigate = useNavigate();
  const { addToQueue, goToId } = useQueueStore();
  const { play } = useSoundStore();
  const [username, setUsername] = useState(
    () => localStorage.getItem('hibi-lastfm-user') ?? '',
  );
  const [usernameInput, setUsernameInput] = useState('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [period, setPeriod] = useState('1month');
  const [tab, setTab] = useState<'recent' | 'artists'>('recent');
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [trackImages, setTrackImages] = useState<Record<string, string>>({});
  const [artistImages, setArtistImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!username) {
      return;
    }
    setLoading(true);
    fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${encodeURIComponent(username)}&api_key=${API_KEY}&period=${period}&limit=20&format=json`,
    )
      .then((res) => res.json())
      .then((data) => setArtists(data.topartists?.artist ?? []))
      .catch(() => setArtists([]))
      .finally(() => setLoading(false));
  }, [period, username]);

  useEffect(() => {
    if (!username) {
      return;
    }
    setLoadingRecent(true);
    fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(username)}&api_key=${API_KEY}&limit=20&format=json`,
    )
      .then((res) => res.json())
      .then((data) => setRecentTracks(data.recenttracks?.track ?? []))
      .catch(() => setRecentTracks([]))
      .finally(() => setLoadingRecent(false));
  }, [username]);

  useEffect(() => {
    if (recentTracks.length === 0) {
      return;
    }
    recentTracks.forEach(async (track) => {
      const lastfmImg = track.image.find((img) => img.size === 'medium')?.[
        '#text'
      ];
      if (isValidImage(lastfmImg)) {
        return;
      }
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(track.artist['#text'] + ' ' + track.name)}&limit=1&entity=song`,
        );
        const data = await res.json();
        const url = data.results?.[0]?.artworkUrl100;
        if (url) {
          setTrackImages((prev) => ({ ...prev, [track.name]: url }));
        }
      } catch {
        /* ignore */
      }
    });
  }, [recentTracks]);

  useEffect(() => {
    if (artists.length === 0) {
      return;
    }
    artists.forEach(async (artist) => {
      const lastfmImg = artist.image.find((img) => img.size === 'extralarge')?.[
        '#text'
      ];
      if (isValidImage(lastfmImg)) {
        return;
      }
      try {
        const res = await fetch(
          `https://itunes.apple.com/search?term=${encodeURIComponent(artist.name)}&limit=1&entity=album`,
        );
        const data = await res.json();
        const url = data.results?.[0]?.artworkUrl100?.replace(
          '100x100',
          '300x300',
        );
        if (url) {
          setArtistImages((prev) => ({ ...prev, [artist.name]: url }));
        }
      } catch {
        /* ignore */
      }
    });
  }, [artists]);

  const handleSaveUsername = () => {
    const clean = usernameInput.trim();
    if (!clean) {
      return;
    }
    localStorage.setItem('hibi-lastfm-user', clean);
    setUsername(clean);
  };

  const handleChangeUser = () => {
    localStorage.removeItem('hibi-lastfm-user');
    setUsername('');
    setUsernameInput('');
    setArtists([]);
    setRecentTracks([]);
  };

  const handleTrackClick = (
    trackName: string,
    artistName: string,
    imageUrl?: string,
  ) => {
    setPlayingTrack(trackName);
    const track = {
      title: trackName,
      artists: [{ name: artistName, roles: ['main' as const] }],
      source: {
        provider: 'nuclear-plugin-youtube',
        id: `${artistName} ${trackName}`,
      },
      artwork: imageUrl ? [{ url: imageUrl, type: 'cover' as const }] : [],
    };
    addToQueue([track]);
    const items = useQueueStore.getState().items;
    const added = items[items.length - 1];
    if (added) {
      goToId(added.id);
      play();
    }
  };

  const handleArtistClick = (artistName: string) => {
    navigate({ to: '/search', search: { q: artistName } });
  };

  const periods = [
    { value: '7day', label: '7 days' },
    { value: '1month', label: '1 month' },
    { value: '3month', label: '3 months' },
    { value: '6month', label: '6 months' },
    { value: '12month', label: '1 year' },
    { value: 'overall', label: 'All time' },
  ];

  // Pantalla de configuración si no hay username
  if (!username) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Hibi Dashboard 🎵</h2>
          <p
            style={{ opacity: 0.6, marginBottom: '1.5rem', fontSize: '0.9rem' }}
          >
            Enter your Last.fm username to see your music stats
          </p>
          <input
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveUsername()}
            placeholder="Your Last.fm username"
            style={{
              width: '100%',
              padding: '0.6rem 1rem',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              color: 'inherit',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            onClick={handleSaveUsername}
            style={{
              padding: '0.6rem 2rem',
              borderRadius: 8,
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '2rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.25rem',
          }}
        >
          <h2 style={{ margin: 0 }}>Hibi Dashboard 🎵</h2>
          <button
            onClick={handleChangeUser}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '0.75rem',
              opacity: 0.6,
            }}
          >
            {username} · change
          </button>
        </div>
        <p
          style={{ opacity: 0.5, marginBottom: '1.5rem', fontSize: '0.85rem' }}
        >
          Your music, your stats
        </p>

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '0.75rem',
          }}
        >
          {(['recent', 'artists'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '0.4rem 1rem',
                borderRadius: '999px',
                border: 'none',
                background:
                  tab === t ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: tab === t ? 600 : 400,
                opacity: tab === t ? 1 : 0.5,
              }}
            >
              {t === 'recent' ? '🕐 Recently played' : '🎤 Top artists'}
            </button>
          ))}
        </div>

        {tab === 'recent' && (
          <div>
            {loadingRecent && <p style={{ opacity: 0.6 }}>Loading...</p>}
            {!loadingRecent &&
              recentTracks.map((track, i) => {
                const lastfmImg = track.image.find(
                  (img) => img.size === 'medium',
                )?.['#text'];
                const img = isValidImage(lastfmImg)
                  ? lastfmImg
                  : trackImages[track.name];
                const isNowPlaying = track['@attr']?.nowplaying === 'true';
                const isPlaying = playingTrack === track.name;
                return (
                  <div
                    key={i}
                    onClick={() =>
                      handleTrackClick(track.name, track.artist['#text'], img)
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isPlaying
                        ? 'rgba(255,255,255,0.08)'
                        : 'transparent',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255,255,255,0.06)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = isPlaying
                        ? 'rgba(255,255,255,0.08)'
                        : 'transparent')
                    }
                  >
                    {img ? (
                      <img
                        src={img}
                        loading="eager"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 4,
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 4,
                          background: 'rgba(255,255,255,0.1)',
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                        {track.name}
                      </div>
                      <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                        {track.artist['#text']}
                      </div>
                    </div>
                    {isNowPlaying && (
                      <span style={{ fontSize: '0.75rem', color: '#e91e63' }}>
                        ▶ now playing
                      </span>
                    )}
                    {isPlaying && !isNowPlaying && (
                      <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>
                        ▶ added
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {tab === 'artists' && (
          <div>
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap',
                marginBottom: '1.5rem',
              }}
            >
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background:
                      period === p.value
                        ? 'rgba(255,255,255,0.15)'
                        : 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {loading && <p style={{ opacity: 0.6 }}>Loading...</p>}
            {!loading && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: '1rem',
                }}
              >
                {artists.map((artist, i) => {
                  const lastfmImg =
                    artist.image.find((img) => img.size === 'mega')?.[
                      '#text'
                    ] ??
                    artist.image.find((img) => img.size === 'extralarge')?.[
                      '#text'
                    ] ??
                    artist.image.find((img) => img.size === 'large')?.['#text'];
                  const img = isValidImage(lastfmImg)
                    ? lastfmImg
                    : artistImages[artist.name];
                  return (
                    <div
                      key={artist.name}
                      style={{
                        borderRadius: 12,
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'transform 0.15s, background 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(255,255,255,0.1)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background =
                          'rgba(255,255,255,0.05)')
                      }
                      onClick={() => handleArtistClick(artist.name)}
                    >
                      {img ? (
                        <img
                          src={img}
                          loading="eager"
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            background: 'rgba(255,255,255,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                          }}
                        >
                          🎤
                        </div>
                      )}
                      <div style={{ padding: '0.75rem' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            marginBottom: '0.2rem',
                          }}
                        >
                          {artist.name}
                        </div>
                        <div style={{ opacity: 0.4, fontSize: '0.75rem' }}>
                          {Number(artist.playcount).toLocaleString()} plays
                        </div>
                        <div
                          style={{
                            opacity: 0.3,
                            fontSize: '0.7rem',
                            marginTop: '0.1rem',
                          }}
                        >
                          #{i + 1}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
