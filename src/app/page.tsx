import Link from 'next/link';

const features = [
  {
    icon: '🧾',
    title: 'Eskaera digitala',
    desc: 'Aginduak momentuan jasotzen dira, paper eta akats gutxiagorekin',
  },
  {
    icon: '📺',
    title: 'KDS denbora errealean',
    desc: 'Sukaldeak eta mostradoreek eskaera guztiak pantailan ikusten dituzte',
  },
  {
    icon: '👥',
    title: 'Boluntarioen kudeaketa',
    desc: 'Erregistratu boluntarioak, esleitu rolak eta kontrolatu sarbidea PINaren bidez',
  },
  {
    icon: '🏪',
    title: 'Txosna anitz',
    desc: 'Elkarte batek ekitaldi berean txosna bat baino gehiago kudea dezake',
  },
  {
    icon: '💳',
    title: 'Online ordainketak',
    desc: 'Stripe bidezko ordainketa digitala, erabat integratuta',
  },
  {
    icon: '⚡',
    title: 'Onboarding azkarra',
    desc: 'Minutu gutxian txosna martxan jar dezakezu, gidatutako prozesuarekin',
  },
];

export default function Home() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <header
        style={{
          background: '#fff',
          borderBottom: '1px solid #e5e7eb',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontWeight: 800,
            fontSize: 20,
            color: '#111827',
          }}
        >
          Txosnabai
        </div>
        <Link
          href="/login"
          style={{ fontSize: 14, fontWeight: 600, color: '#6b7280', textDecoration: 'none' }}
        >
          Saioa hasi →
        </Link>
      </header>

      {/* Hero */}
      <section
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '80px 24px 64px',
          textAlign: 'center',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 'clamp(28px, 5vw, 48px)',
            fontWeight: 800,
            color: '#111827',
            lineHeight: 1.15,
            marginBottom: 20,
          }}
        >
          Zure txosna, modu digitalean kudeatuta
        </h1>
        <p
          style={{
            fontSize: 18,
            color: '#6b7280',
            lineHeight: 1.7,
            maxWidth: 560,
            margin: '0 auto 40px',
          }}
        >
          Elkarteak erregistratu eta jaialdietan txosnen kudeaketa osoa egin dezake: eskaera
          digitalak, KDS, boluntarioak eta ordainketak, dena toki batetik.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/register"
            style={{
              background: '#e85d2f',
              color: '#fff',
              padding: '14px 28px',
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Elkartea erregistratu
          </Link>
          <Link
            href="/login"
            style={{
              background: '#fff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              padding: '14px 28px',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 15,
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Dagoeneko kontu bat dut →
          </Link>
        </div>
      </section>

      {/* Features grid */}
      <section
        style={{
          maxWidth: 960,
          margin: '0 auto',
          padding: '0 24px 80px',
          width: '100%',
          boxSizing: 'border-box',
          flex: 1,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: '#fff',
                borderRadius: 16,
                border: '1px solid #e5e7eb',
                padding: 24,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3
                style={{
                  fontFamily: 'var(--font-nunito, sans-serif)',
                  fontSize: 16,
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: 6,
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid #e5e7eb',
          padding: '24px',
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 13,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontWeight: 700,
            color: '#374151',
          }}
        >
          Txosnabai
        </span>
        {' · '}Txosnen kudeaketa digitala{' · '}© {new Date().getFullYear()}
      </footer>
    </div>
  );
}
