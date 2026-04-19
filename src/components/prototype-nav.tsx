'use client';
import Link from 'next/link';

/**
 * Floating "back to prototype" link — only shown in development.
 * Drop into any page or layout.
 */
export function PrototypeNav() {
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <Link
      href="/prototype"
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: 'rgba(15,17,23,0.85)',
        color: '#94a3b8',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8,
        padding: '6px 12px',
        fontSize: 12,
        fontFamily: 'system-ui, sans-serif',
        textDecoration: 'none',
        backdropFilter: 'blur(8px)',
        opacity: 0.5,
        transition: 'opacity 0.15s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
    >
      ← Prototipoa
    </Link>
  );
}
