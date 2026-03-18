import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Glamperos — Glamping en Colombia'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1c1917 0%, #0c2318 60%, #052e16 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          <span style={{ fontSize: 72, fontWeight: 800, color: '#34d399' }}>Glamp</span>
          <span style={{ fontSize: 72, fontWeight: 800, color: '#fafaf9' }}>eros</span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 28,
            color: '#a8a29e',
            textAlign: 'center',
            maxWidth: 700,
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          Los mejores glampings de Colombia
        </p>
        <p
          style={{
            fontSize: 22,
            color: '#34d399',
            marginTop: 16,
            letterSpacing: 2,
          }}
        >
          Domos · Cabañas · Treehouses
        </p>
      </div>
    ),
    { ...size }
  )
}
