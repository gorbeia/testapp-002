'use client';
import Link from 'next/link';

const LOCALE = '/eu';
const SLUG = 'aste-nagusia-2026';

const screens = [
  {
    group: '👤 Bezeroa (Customer)',
    color: '#2d5a3d',
    items: [
      { name: 'Menu & Eskaera', route: `${LOCALE}/${SLUG}`, desc: 'Browse menu, add to cart' },
      {
        name: 'Eskaera Baieztapena',
        route: `${LOCALE}/${SLUG}/checkout`,
        desc: 'Cart summary, place order',
      },
      {
        name: 'Eskaera Egoera',
        route: `${LOCALE}/order/order-1`,
        desc: 'Post-order status, live updates',
      },
      {
        name: 'Frogagirria (Pickup Proof)',
        route: `${LOCALE}/order/order-1/proof`,
        desc: 'Show at pickup — high contrast',
      },
      { name: 'Order Board', route: `${LOCALE}/${SLUG}/board`, desc: 'Public TV display screen' },
    ],
  },
  {
    group: '🍳 Boluntarioa (Volunteer)',
    color: '#e8622f',
    items: [
      { name: 'Saioa Hasi (Login)', route: '/login', desc: 'Email + password' },
      { name: 'Pasahitza Berrezarri', route: '/reset-password', desc: 'Password reset flow' },
      { name: 'PIN Sarrera', route: `${LOCALE}/pin`, desc: 'Mode selector + numpad' },
      {
        name: 'Janari Mostradore',
        route: `${LOCALE}/counter`,
        desc: 'Food counter — pending, new order, ready',
      },
      { name: 'Edari Mostradore', route: `${LOCALE}/drinks`, desc: 'Drinks counter — POS grid' },
      {
        name: 'Sukalde (KDS)',
        route: `${LOCALE}/kitchen`,
        desc: 'Kitchen Display System — Kanban',
      },
      {
        name: 'Egoera Ikuspegi',
        route: `${LOCALE}/overview`,
        desc: 'Status overview — live snapshot',
      },
    ],
  },
  {
    group: '⚙️ Administratzailea (Admin)',
    color: '#3b82f6',
    items: [
      { name: 'Erregistroa', route: '/register', desc: 'Association signup' },
      { name: 'Onboarding Gida', route: `${LOCALE}/onboarding`, desc: '5-step setup checklist' },
      {
        name: 'Admin Hasiera (Txosnak)',
        route: `${LOCALE}/txosnak`,
        desc: 'Txosna overview & clone',
      },
      {
        name: 'Elkarte Ezarpenak',
        route: `${LOCALE}/settings`,
        desc: 'Association name, payment providers, volunteers',
      },
      { name: 'Menu Kudeaketa', route: `${LOCALE}/menu`, desc: 'Categories + products' },
      {
        name: 'Txosna Konfigurazioa',
        route: `${LOCALE}/txosnak/txosna-1/settings`,
        desc: 'Counter type, channels, payments, QR',
      },
      {
        name: 'Txosna Produktuak',
        route: `${LOCALE}/txosnak/txosna-1/products`,
        desc: 'Per-txosna product selection & price overrides',
      },
      { name: 'Boluntarioak', route: `${LOCALE}/volunteers`, desc: 'Volunteer management' },
      { name: 'Txostena', route: `${LOCALE}/reports`, desc: 'Post-event report' },
    ],
  },
];

export default function PrototypePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        color: '#f1f5f9',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div
            style={{
              fontSize: 12,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#64748b',
              marginBottom: 8,
            }}
          >
            Prototipo modua · Datu simulatuak · Autentifikaziorik gabe
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#f1f5f9',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Txosna — Prototipo Nabigatzailea
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>
            All screens are navigable. Mock data only — no backend required.
          </p>
        </div>

        {/* Screen groups */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {screens.map((group) => (
            <div key={group.group}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: group.color,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: `1px solid ${group.color}30`,
                }}
              >
                {group.group}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: 8,
                }}
              >
                {group.items.map((item) => (
                  <Link key={item.route} href={item.route} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: 10,
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = group.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#334155')}
                    >
                      <div
                        style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 4 }}
                      >
                        {item.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{item.desc}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#475569',
                          marginTop: 6,
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.route}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
