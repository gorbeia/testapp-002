'use client';
import { signOut } from 'next-auth/react';

interface LogoutButtonProps {
  variant?: 'sidebar' | 'ops';
  label?: string;
}

export function LogoutButton({ variant = 'sidebar', label = 'Amaitu saioa' }: LogoutButtonProps) {
  function handleLogout() {
    signOut({ callbackUrl: '/login' });
  }

  if (variant === 'ops') {
    return (
      <button
        onClick={handleLogout}
        style={{
          fontSize: 12,
          color: 'var(--ops-text-dim)',
          background: 'none',
          border: '1px solid var(--ops-border)',
          borderRadius: 6,
          padding: '4px 10px',
          cursor: 'pointer',
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        fontSize: 12,
        color: 'var(--adm-sidebar-label)',
        background: 'none',
        border: 'none',
        padding: '4px 12px',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
      }}
    >
      {label}
    </button>
  );
}
