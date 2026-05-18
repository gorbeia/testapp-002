'use client';
import React from 'react';

export function IconBtn({
  onClick,
  title,
  children,
  danger,
  disabled,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 7px',
        border: '1px solid var(--adm-border)',
        borderRadius: 6,
        background: 'transparent',
        color: danger ? '#ef4444' : 'var(--adm-text-sec)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        lineHeight: 1,
        opacity: disabled ? 0.35 : 1,
      }}
    >
      {children}
    </button>
  );
}
