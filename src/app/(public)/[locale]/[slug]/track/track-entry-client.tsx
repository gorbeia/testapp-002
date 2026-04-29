'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  slug: string;
  locale: string;
  txosnaName: string;
}

export function TrackEntryClient({ slug, locale, txosnaName }: Props) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    const res = await fetch(
      `/api/txosnak/${slug}/orders/lookup?code=${encodeURIComponent(trimmed)}`
    );
    if (!res.ok) {
      setError('Koderik ez da aurkitu. Egiaztatu kodea eta saiatu berriro.');
      return;
    }
    setError('');
    router.push(`/${locale}/${slug}/track/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg, #f8f8f8)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 380,
          width: '100%',
          background: '#fff',
          borderRadius: 16,
          padding: '32px 24px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{txosnaName}</div>
        <div style={{ fontSize: 14, color: '#666', marginBottom: 28 }}>Eskaeraren jarraipena</div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="code-input"
              style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}
            >
              Zure kodea
            </label>
            <input
              id="code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Adib.: AB-1234"
              autoComplete="off"
              autoCapitalize="characters"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: 20,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: 3,
                borderRadius: 10,
                border: '2px solid #e0e0e0',
                outline: 'none',
                boxSizing: 'border-box',
                textTransform: 'uppercase',
              }}
            />
            <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>Adib.: AB-1234</div>
          </div>

          {error && (
            <div
              style={{
                fontSize: 13,
                color: '#c0392b',
                background: '#fdf0f0',
                border: '1px solid #f5c6c6',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              padding: '14px 0',
              background: '#e85d2f',
              border: 'none',
              borderRadius: 10,
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Bilatu
          </button>
        </form>
      </div>
    </div>
  );
}
