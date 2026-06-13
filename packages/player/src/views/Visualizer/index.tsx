import { FC, useEffect, useRef, useState } from 'react';

import { analyzerStore } from '@nuclearplayer/hifi';
import { pickArtwork } from '@nuclearplayer/model';

import { useQueueStore } from '../../stores/queueStore';
import { useSoundStore } from '../../stores/soundStore';

type Mode = 'artwork' | 'plasma' | 'aurora' | 'battery';

export const VisualizerView: FC = () => {
  const currentItem = useQueueStore((s) => s.getCurrentItem());
  const status = useSoundStore((s) => s.status);
  const track = currentItem?.track;
  const isPlaying = status === 'playing';
  const [mode, setMode] = useState<Mode>('battery');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const feedbackRef = useRef<HTMLCanvasElement | null>(null);

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

    if (!feedbackRef.current) {
      feedbackRef.current = document.createElement('canvas');
    }
    const fb = feedbackRef.current;
    const fbCtx = fb.getContext('2d');

    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      fb.width = canvas.width;
      fb.height = canvas.height;
    };
    resize();
    window.addEventListener('resize', resize);

    let t = 0;

    let coreX = canvas.width / 2;
    let coreY = canvas.height / 2;
    let targetX = coreX;
    let targetY = coreY;
    let nextRetarget = 0;
    let pauseUntil = 0;

    const getBands = () => {
      const analyser = analyzerStore.node;
      let bass = 0,
        mid = 0,
        treble = 0,
        overall = 0;
      if (analyser) {
        const bins = analyser.frequencyBinCount;
        const data = new Uint8Array(bins);
        analyser.getByteFrequencyData(data);
        const third = Math.floor(bins / 3);
        for (let i = 0; i < third; i++) {
          bass += data[i];
        }
        for (let i = third; i < third * 2; i++) {
          mid += data[i];
        }
        for (let i = third * 2; i < bins; i++) {
          treble += data[i];
        }
        bass /= third * 255;
        mid /= third * 255;
        treble /= third * 255;
        overall = (bass + mid + treble) / 3;
      }
      return { bass, mid, treble, overall };
    };

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const { bass, mid, treble, overall } = getBands();

      t += 0.01 + overall * 0.04;

      if (mode === 'plasma') {
        ctx.fillStyle = 'rgba(10, 6, 12, 0.25)';
        ctx.fillRect(0, 0, w, h);
        const maxR = Math.min(w, h) * 0.45;
        const rings = 40;
        for (let i = rings; i > 0; i--) {
          const frac = i / rings;
          const energy = i % 3 === 0 ? bass : i % 3 === 1 ? mid : treble;
          const radius =
            maxR * frac * (1 + energy * 0.6) +
            Math.sin(t * 2 + i * 0.3) * 12 * (1 + overall * 3);
          const hue = (t * 30 + i * 8 + bass * 120) % 360;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.max(1, radius), 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue}, 90%, ${50 + energy * 30}%, ${0.15 + frac * 0.4})`;
          ctx.lineWidth = 2 + energy * 6;
          ctx.stroke();
        }
        const coreR = maxR * 0.15 * (1 + bass * 1.5);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
        grad.addColorStop(0, `hsla(${(t * 50) % 360}, 100%, 75%, 0.9)`);
        grad.addColorStop(1, `hsla(${(t * 50 + 60) % 360}, 100%, 50%, 0)`);
        ctx.beginPath();
        ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      if (mode === 'aurora') {
        ctx.fillStyle = 'rgba(8, 10, 14, 0.12)';
        ctx.fillRect(0, 0, w, h);
        const layers = 6;
        for (let l = 0; l < layers; l++) {
          const energy = l < 2 ? bass : l < 4 ? mid : treble;
          ctx.beginPath();
          const hue = (t * 20 + l * 50 + 120) % 360;
          ctx.fillStyle = `hsla(${hue}, 70%, 55%, ${0.08 + energy * 0.15})`;
          ctx.moveTo(0, h);
          for (let x = 0; x <= w; x += 8) {
            const wave =
              Math.sin(x * 0.006 + t * 1.5 + l) * (40 + energy * 180) +
              Math.sin(x * 0.013 - t * 2 + l * 2) * (25 + energy * 90);
            const y = cy + wave + (l - layers / 2) * 30;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fill();
        }
      }

      if (mode === 'battery' && fbCtx) {
        // --- Núcleo flotante: deriva suave + pausas largas ---
        const now = t;
        if (now > nextRetarget && now > pauseUntil) {
          if (Math.random() < 0.45) {
            pauseUntil = now + 3 + Math.random() * 4;
            targetX = coreX;
            targetY = coreY;
          } else {
            const drift = Math.min(w, h) * 0.22;
            targetX = coreX + (Math.random() - 0.5) * drift * 2;
            targetY = coreY + (Math.random() - 0.5) * drift * 2;
            const margin = Math.min(w, h) * 0.2;
            targetX = Math.max(margin, Math.min(w - margin, targetX));
            targetY = Math.max(margin, Math.min(h - margin, targetY));
          }
          nextRetarget = now + 4 + Math.random() * 3;
        }
        coreX += (targetX - coreX) * 0.006;
        coreY += (targetY - coreY) * 0.006;

        // 1) Copiar frame anterior
        fbCtx.clearRect(0, 0, w, h);
        fbCtx.drawImage(canvas, 0, 0);

        // 2) Repintar rotando/escalando (fondo rainbow lento y oscuro)
        const bgHue = (t * 6) % 360;
        ctx.fillStyle = `hsl(${bgHue}, 45%, 8%)`;
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(coreX, coreY);
        const rot = 0.004 + overall * 0.02;
        const scale = 1.02 + bass * 0.02;
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        ctx.globalAlpha = 0.94;
        ctx.drawImage(fb, -coreX, -coreY);
        ctx.restore();
        ctx.globalAlpha = 1;

        // 3) Filamentos saliendo del núcleo
        const hueBase = (t * 6) % 360;
        const filaments = 5;
        for (let f = 0; f < filaments; f++) {
          const energy = f % 3 === 0 ? bass : f % 3 === 1 ? mid : treble;
          ctx.beginPath();
          const baseAngle = t * 0.8 + (f / filaments) * Math.PI * 2;
          let px = coreX,
            py = coreY;
          ctx.moveTo(px, py);
          const segments = 30;
          for (let s = 1; s <= segments; s++) {
            const frac = s / segments;
            const radius = frac * Math.min(w, h) * 0.4 * (0.6 + energy);
            const wobble = Math.sin(t * 3 + s * 0.5 + f) * 0.6;
            const angle = baseAngle + wobble + frac * 2;
            px = coreX + Math.cos(angle) * radius;
            py = coreY + Math.sin(angle) * radius;
            ctx.lineTo(px, py);
          }
          const hue = (hueBase + f * 30) % 360;
          ctx.strokeStyle = `hsla(${hue}, 80%, ${60 + energy * 30}%, ${0.25 + energy * 0.5})`;
          ctx.lineWidth = 1.5 + energy * 3;
          ctx.stroke();
        }

        // 4) Núcleo brillante que late
        const coreR = 30 * (1 + bass * 2.5);
        const grad = ctx.createRadialGradient(
          coreX,
          coreY,
          0,
          coreX,
          coreY,
          coreR,
        );
        grad.addColorStop(0, `hsla(${hueBase}, 100%, 90%, 0.95)`);
        grad.addColorStop(0.5, `hsla(${(hueBase + 40) % 360}, 100%, 70%, 0.5)`);
        grad.addColorStop(1, `hsla(${(hueBase + 40) % 360}, 100%, 60%, 0)`);
        ctx.beginPath();
        ctx.arc(coreX, coreY, coreR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [mode]);

  const modes: { value: Mode; label: string }[] = [
    { value: 'artwork', label: '🖼️ Artwork' },
    { value: 'plasma', label: '🌀 Núcleo' },
    { value: 'aurora', label: '🌌 Aurora' },
    { value: 'battery', label: '🔋 Battery' },
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
              background: '#000',
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
