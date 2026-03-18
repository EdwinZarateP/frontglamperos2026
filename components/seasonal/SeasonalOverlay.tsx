'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ─────────────────────────────────────────────────────────────────────────────
// Duración del recorrido completo del personaje (segundos)
// ─────────────────────────────────────────────────────────────────────────────
const DURATION = 45

// El personaje va de -8% a 108% → rango 116%
// delay para que el drop aparezca justo cuando el personaje pasa por `pos`%:
// LTR: delay = ((pos + 8) / 116) * DURATION
// RTL: delay = ((108 - pos) / 116) * DURATION
const ltrDelay = (pos: number) => +((( pos + 8) / 116) * DURATION).toFixed(2)
const rtlDelay = (pos: number) => +(((108 - pos) / 116) * DURATION).toFixed(2)

// ─────────────────────────────────────────────────────────────────────────────
// Configuración por temporada
// ─────────────────────────────────────────────────────────────────────────────
const SEASONS = {

  navidad: {
    css: `
      @keyframes santa-walk {
        from { left: -9%; }
        to   { left: 109%; }
      }
      @keyframes santa-bob {
        0%,100% { transform: translateY(-50%) rotate(-2deg); }
        50%     { transform: translateY(calc(-50% - 5px)) rotate(2deg); }
      }
      @keyframes gift-drop {
        0%   { transform: translateY(0px)  scale(0.4); opacity: 0; }
        18%  { transform: translateY(-8px) scale(1);   opacity: 1; }
        100% { transform: translateY(32px) scale(0.8); opacity: 0; }
      }
      .s-char {
        position: absolute;
        top: 50%;
        font-size: 28px;
        line-height: 1;
        animation: santa-walk ${DURATION}s linear infinite,
                   santa-bob 0.7s ease-in-out infinite;
        animation-delay: 0s, 0s;
      }
      .s-drop {
        position: absolute;
        top: 30%;
        font-size: 18px;
        line-height: 1;
        animation: gift-drop 3.5s ease-out infinite;
      }
    `,
    character: '🎅',
    rtl: false,
    drops: [
      { emoji: '🎁', pos: 15 },
      { emoji: '⭐', pos: 30 },
      { emoji: '🎁', pos: 45 },
      { emoji: '🎄', pos: 60 },
      { emoji: '🎁', pos: 75 },
    ],
  },

  halloween: {
    css: `
      @keyframes witch-fly {
        from { left: 109%; }
        to   { left: -9%; }
      }
      @keyframes witch-wave {
        0%,100% { transform: translateY(-50%) rotate(4deg)  scaleX(-1); }
        50%     { transform: translateY(calc(-50% - 6px)) rotate(-4deg) scaleX(-1); }
      }
      @keyframes candy-drop {
        0%   { transform: translateY(0px)  scale(0.4); opacity: 0; }
        18%  { transform: translateY(-7px) scale(1);   opacity: 1; }
        100% { transform: translateY(30px) scale(0.8); opacity: 0; }
      }
      .s-char {
        position: absolute;
        top: 50%;
        font-size: 28px;
        line-height: 1;
        animation: witch-fly ${DURATION}s linear infinite,
                   witch-wave 0.9s ease-in-out infinite;
      }
      .s-drop {
        position: absolute;
        top: 30%;
        font-size: 18px;
        line-height: 1;
        animation: candy-drop 3.5s ease-out infinite;
      }
    `,
    character: '🧙‍♀️',
    rtl: true,
    drops: [
      { emoji: '🍬', pos: 85 },
      { emoji: '🍭', pos: 70 },
      { emoji: '🍬', pos: 55 },
      { emoji: '🎃', pos: 40 },
      { emoji: '🍭', pos: 25 },
    ],
  },

  'san-valentin': {
    css: `
      @keyframes cupid-fly {
        from { left: -9%; }
        to   { left: 109%; }
      }
      @keyframes cupid-float {
        0%,100% { transform: translateY(-50%) rotate(-5deg); }
        50%     { transform: translateY(calc(-50% - 7px)) rotate(5deg); }
      }
      @keyframes heart-rise {
        0%   { transform: translateY(0px)  scale(0.4); opacity: 0; }
        18%  { transform: translateY(-9px) scale(1);   opacity: 1; }
        100% { transform: translateY(-36px) scale(0.7); opacity: 0; }
      }
      .s-char {
        position: absolute;
        top: 50%;
        font-size: 26px;
        line-height: 1;
        animation: cupid-fly ${DURATION}s linear infinite,
                   cupid-float 1s ease-in-out infinite;
      }
      .s-drop {
        position: absolute;
        top: 55%;
        font-size: 17px;
        line-height: 1;
        animation: heart-rise 3.5s ease-out infinite;
      }
    `,
    character: '👼',
    rtl: false,
    drops: [
      { emoji: '❤️',  pos: 15 },
      { emoji: '💕',  pos: 30 },
      { emoji: '💖',  pos: 45 },
      { emoji: '❤️',  pos: 60 },
      { emoji: '💝',  pos: 75 },
    ],
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────────────────────────────────────
export function SeasonalOverlay() {
  const { data: activeSeason } = useQuery({
    queryKey: ['active-season'],
    queryFn: async () => {
      const res = await api.get('/config/season')
      return res.data.activeSeason as string | null
    },
    staleTime: 1000 * 60 * 5,
  })

  if (!activeSeason || !(activeSeason in SEASONS)) return null

  const season = SEASONS[activeSeason as keyof typeof SEASONS]
  const delayFn = season.rtl ? rtlDelay : ltrDelay

  return (
    <>
      <style>{season.css}</style>
      <div aria-hidden className="absolute inset-0">
        {/* Personaje principal */}
        <span className="s-char select-none">{season.character}</span>

        {/* Regalos / dulces / corazones que "suelta" al pasar */}
        {season.drops.map((d, i) => (
          <span
            key={i}
            className="s-drop select-none"
            style={{
              left: `${d.pos}%`,
              animationDelay: `${delayFn(d.pos)}s`,
              animationDuration: '3.5s',
            }}
          >
            {d.emoji}
          </span>
        ))}
      </div>
    </>
  )
}
