'use client';
import React from 'react';

export function FormLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--adm-text-pri)',
        marginBottom: 6,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function FormHint({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 4 }}>{children}</div>;
}

export function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        background: 'var(--adm-surface)',
        border: '1px solid var(--adm-border)',
        borderRadius: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--adm-text-pri)' }}>{label}</div>
        {hint && (
          <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 2 }}>{hint}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 99,
          border: 'none',
          background: checked ? '#e85d2f' : 'var(--adm-border)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--adm-surface)',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  );
}

export function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        alignSelf: 'flex-start',
        padding: '10px 24px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        color: '#fff',
        background: saved ? '#22c55e' : '#e85d2f',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {saved ? '✓ Gordeta' : 'Gorde'}
    </button>
  );
}
