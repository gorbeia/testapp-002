'use client';
import { useTheme } from './theme-provider';

export function ThemeToggle({ variant = 'ops' }: { variant?: 'ops' | 'admin' | 'cust' }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'admin') {
    return (
      <button
        onClick={toggle}
        title={isDark ? 'Argi modua' : 'Ilun modua'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          width: '100%',
          padding: '8px 12px',
          borderRadius: 8,
          background: 'transparent',
          border: 'none',
          color: '#64748b',
          fontSize: 13,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 15 }}>{isDark ? '☀️' : '🌙'}</span>
        <span>{isDark ? 'Argi modua' : 'Ilun modua'}</span>
      </button>
    );
  }

  const borderVar = variant === 'cust' ? 'var(--cust-border)' : 'var(--ops-border)';
  const colorVar = variant === 'cust' ? 'var(--cust-text-sec)' : 'var(--ops-text-dim)';

  return (
    <button
      onClick={toggle}
      title={isDark ? 'Argi modua' : 'Ilun modua'}
      style={{
        fontSize: 16,
        background: 'none',
        border: `1px solid ${borderVar}`,
        borderRadius: 6,
        padding: '4px 8px',
        cursor: 'pointer',
        color: colorVar,
        lineHeight: 1,
      }}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
}
