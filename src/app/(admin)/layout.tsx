'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { MOCK_ASSOCIATION } from '@/lib/mock-data';

const TXOSNA_NAV = [
  { segment: '', label: 'Hasiera', icon: '📊' },
  { segment: '/products', label: 'Produktuak', icon: '🍽' },
  { segment: '/settings', label: 'Konfigurazioa', icon: '⚙️' },
  { segment: '/reports', label: 'Txostena', icon: '📈' },
];

const ASSOCIATION_NAV = [
  { href: '/eu/menu', label: 'Menua', icon: '🍽' },
  { href: '/eu/txosnak', label: 'Txosnak', icon: '🏘' },
  { href: '/eu/volunteers', label: 'Boluntarioak', icon: '👥' },
  { href: '/eu/settings', label: 'Ezarpenak', icon: '⚙️' },
];

const STATUS_DOT: Record<string, string> = {
  OPEN: '#22c55e',
  PAUSED: '#f59e0b',
  CLOSED: '#6b7280',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Detect which txosna is active from the URL: /eu/txosnak/[id]/...
  const txosnaMatch = pathname.match(/\/txosnak\/([^/]+)/);
  const activeTxosnaId = txosnaMatch?.[1] ?? null;
  const activeTxosna = MOCK_ASSOCIATION.txosnak.find((t) => t.id === activeTxosnaId) ?? null;

  // Track which txosnak are expanded in sidebar
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    if (activeTxosnaId) init[activeTxosnaId] = true;
    return init;
  });

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
        background: 'var(--adm-bg)',
        color: 'var(--adm-text-pri)',
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 228,
          background: 'var(--adm-sidebar-bg)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'auto',
        }}
      >
        {/* Association header */}
        <div style={{ padding: '18px 16px 10px' }}>
          <div
            style={{
              fontFamily: 'var(--font-nunito, sans-serif)',
              fontSize: 15,
              fontWeight: 800,
              color: '#f1f5f9',
              letterSpacing: '-0.01em',
            }}
          >
            Txosna Admin
          </div>
          <div style={{ fontSize: 11, color: 'var(--adm-sidebar-label)', marginTop: 2 }}>
            {MOCK_ASSOCIATION.name}
          </div>
        </div>

        <nav
          style={{
            flex: 1,
            padding: '4px 8px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {/* Association-level navigation */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--adm-sidebar-label)',
              padding: '6px 12px 4px',
              opacity: 0.7,
            }}
          >
            Elkartea
          </div>
          {ASSOCIATION_NAV.map((item) => {
            const isActive =
              pathname === item.href ||
              (pathname.startsWith(item.href + '/') && item.href !== '/eu/txosnak');
            const isTxosnakActive =
              item.href === '/eu/txosnak' &&
              (pathname === item.href ||
                pathname === '/eu/dashboard' ||
                (pathname.startsWith('/eu/txosnak/') && !pathname.includes('/txosnak/')));
            const active = isActive || isTxosnakActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  padding: '8px 12px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: active ? '#93c5fd' : 'var(--adm-sidebar-text)',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Divider */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--adm-sidebar-label)',
              padding: '12px 12px 4px',
              opacity: 0.7,
              marginTop: 4,
            }}
          >
            Txosnak
          </div>

          {/* Txosnak list */}
          {MOCK_ASSOCIATION.txosnak.map((tx) => {
            const txBase = `/eu/txosnak/${tx.id}`;
            const isTxActive = activeTxosnaId === tx.id;
            const isOpen = expanded[tx.id] || isTxActive;

            return (
              <div key={tx.id}>
                {/* Txosna row */}
                <button
                  onClick={() => toggle(tx.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    background: isTxActive ? 'rgba(232,98,47,0.12)' : 'transparent',
                    color: isTxActive ? '#fba07a' : 'var(--adm-sidebar-text)',
                    fontSize: 13,
                    fontWeight: isTxActive ? 600 : 400,
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: STATUS_DOT[tx.status] ?? '#6b7280',
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tx.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: 'var(--adm-sidebar-label)',
                      transition: 'transform 0.15s',
                      display: 'inline-block',
                      transform: isOpen ? 'rotate(90deg)' : 'none',
                    }}
                  >
                    ›
                  </span>
                </button>

                {/* Txosna sub-nav */}
                {isOpen && (
                  <div style={{ paddingLeft: 14, paddingBottom: 4 }}>
                    {TXOSNA_NAV.map((item) => {
                      const href = txBase + item.segment;
                      const active =
                        item.segment === ''
                          ? pathname === txBase || pathname === txBase + '/'
                          : pathname.startsWith(txBase + item.segment);
                      return (
                        <Link
                          key={item.segment}
                          href={href}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 10px',
                            borderRadius: 7,
                            textDecoration: 'none',
                            background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                            color: active ? '#93c5fd' : 'var(--adm-sidebar-text)',
                            fontSize: 13,
                            fontWeight: active ? 600 : 400,
                            opacity: 0.9,
                          }}
                        >
                          <span style={{ fontSize: 13 }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add txosna */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              border: '1px dashed rgba(255,255,255,0.12)',
              borderRadius: 8,
              cursor: 'pointer',
              background: 'transparent',
              color: 'var(--adm-sidebar-label)',
              fontSize: 12,
              marginTop: 4,
              width: '100%',
            }}
          >
            <span>＋</span>
            <span>Txosna berria</span>
          </button>
        </nav>

        <div
          style={{
            padding: '8px 8px 16px',
            borderTop: '1px solid var(--adm-sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <ThemeToggle variant="admin" />
          <Link
            href="/eu/pin"
            style={{
              fontSize: 12,
              color: 'var(--adm-sidebar-label)',
              textDecoration: 'none',
              padding: '4px 12px',
            }}
          >
            ← Mostradorera itzuli
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--adm-bg)' }}>{children}</main>
    </div>
  );
}
