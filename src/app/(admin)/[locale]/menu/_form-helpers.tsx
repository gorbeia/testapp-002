'use client';
import React from 'react';

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--adm-border)',
  fontSize: 14,
  outline: 'none',
  background: 'var(--adm-surface)',
  color: 'var(--adm-text-pri)',
  boxSizing: 'border-box',
};

export const sectionLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  color: 'var(--adm-text-sec)',
  marginBottom: 8,
};

export function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: `2px solid ${active ? '#e85d2f' : 'var(--adm-border)'}`,
        background: active ? 'var(--adm-surface)' : 'var(--adm-surface-hi)',
        color: active ? '#e85d2f' : 'var(--adm-text-sec)',
        transition: 'all 0.12s',
      }}
    >
      {label}
    </button>
  );
}
