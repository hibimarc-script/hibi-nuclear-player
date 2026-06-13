import { FC, useEffect, useRef, useState } from 'react';

import { pickArtwork } from '@nuclearplayer/model';

import { useQueueStore } from '../../stores/queueStore';
import { useSoundStore } from '../../stores/soundStore';

type Mode = 'artwork' | 'waves' | 'particles';

export const VisualizerView: FC = () => {
  const currentItem = useQueueStore((s) => s.getCurrentItem());
  const status = useSoundStore((s) => s.status);
  const track = currentItem?.track;
  const isPlaying = status === 'playing';
  const [mode, setMode] = useState<Mode>('artwork');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  const artwork = pickArtwork(track?.artwork, 'cover', 600)?.url;

  useEffect(() => {
    if (mode === 'artwork') {
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;
    // Partículas para el modo particles
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 3 + 1,
      speed: Math.random() * 0.4 + 0.1,
      hue: Math.random() * 360,
    }));

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      // Velocidad de animación: si está en pausa, casi quieto
      const pace = isPlaying ? 1 : 0.15;
      t += 0.02 * pace;

      // Fondo con leve estela (efecto trail)
      ctx.fillStyle = 'rgba(20, 12, 16, 0.18)';
      ctx.fillRect(0, 0, w, h);

      if (mode === 'waves') {
        const lines = 5;
        for (let l = 0; l < lines; l++) {
          ctx.beginPath();
          const hue = (t * 40 + l * 60) % 360;
          ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.7)`;
          ctx.lineWidth = 2.5;
          for (let x = 0; x <= w; x += 6) {
            const phase = x * 0.012 + t * 2 + l * 0.8;
            const amp = (h / 6) * (1 + 0.4 * Math.sin(t + l));
            const y = h / 2 + Math.sin(phase) * amp * Math.sin(x * 0.002 + t);
            if (x === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          }
          ctx.stroke();
        }
      }

      if (mode === 'particles') {
        for (const p of particles) {
          p.y -= p.speed * 0.004 * (isPlaying ? 1 : 0.2);
          if (p.y < 0) {
            p.y = 1;
            p.x = Math.random();
          }
          const pulse = 1 + 0.5 * Math.sin(t * 3 + p.x * 10);
          const px = p.x * w;
          const py = p.y * h;
          const radius = p.r * pulse * (w / 400);
          ctx.beginPath();
          ctx.arc(px, py, radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${(p.hue + t * 30) % 360}, 75%, 65%, 0.8)`;
          ctx.fill();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [mode, isPlaying]);

  const modes: { value: Mode; label: string }[] = [
    { value: 'artwork', label: '🖼️ Artwork' },
    { value: 'waves', label: '🌊 Ondas' },
    { value: 'particles', label: '✨ Partículas' },
  ];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem',
        boxSizing: 'border-box',
      }}
    >
      {/* Botones de modo */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}
      >
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            style={{
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              border: '1px solid rgba(255,255,255,0.2)',
              background:
                mode === m.value ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: mode === m.value ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Área de visualización */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          minHeight: 0,
        }}
      >
        {mode === 'artwork' && (
          <div style={{ textAlign: 'center' }}>
            {artwork ? (
              <img
                src={artwork}
                loading="eager"
                style={{
                  maxWidth: '70vh',
                  maxHeight: '60vh',
                  width: 'auto',
                  borderRadius: 16,
                  objectFit: 'cover',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  animation: isPlaying
                    ? 'hibiPulse 3s ease-in-out infinite'
                    : 'none',
                }}
              />
            ) : (
              <div
                style={{
                  width: 300,
                  height: 300,
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                }}
              >
                🎵
              </div>
            )}
            {track && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontWeight: 600, fontSize: '1.3rem' }}>
                  {track.title}
                </div>
                <div
                  style={{
                    opacity: 0.6,
                    fontSize: '1rem',
                    marginTop: '0.3rem',
                  }}
                >
                  {track.artists[0]?.name}
                </div>
              </div>
            )}
          </div>
        )}

        {mode !== 'artwork' && (
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 16,
              background: 'rgba(20,12,16,1)',
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes hibiPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
};
