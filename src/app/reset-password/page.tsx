'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/volunteers/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Errorea gertatu da.');
        return;
      }
      setSent(true);
    } catch {
      setError('Konexio errorea. Saiatu berriro.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="ops-theme min-h-screen flex items-center justify-center px-4">
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <ThemeToggle variant="ops" />
      </div>
      <div style={{ width: '100%', maxWidth: 360 }}>
        <div className="text-center mb-8">
          <div
            className="text-2xl font-black mb-1"
            style={{ fontFamily: 'var(--font-nunito), sans-serif', color: 'var(--ops-text-pri)' }}
          >
            Txosna
          </div>
        </div>

        <div
          className="rounded-2xl p-6"
          style={{ background: 'var(--ops-surface)', border: '1px solid var(--ops-border)' }}
        >
          {!sent ? (
            <>
              <h1 className="text-lg font-bold mb-2" style={{ color: 'var(--ops-text-pri)' }}>
                Pasahitza berrezarri
              </h1>
              <p className="text-sm mb-5" style={{ color: 'var(--ops-text-sec)' }}>
                Zure posta elektronikoa sartu eta esteka bat bidaliko dizugu.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="zure@posta.eus"
                  required
                  disabled={isLoading}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none disabled:opacity-50"
                  style={{
                    background: 'var(--ops-surface-hi)',
                    border: '1px solid var(--ops-border)',
                    color: 'var(--ops-text-pri)',
                  }}
                />
                {error && (
                  <div className="text-sm" style={{ color: 'var(--ops-red)' }}>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl py-3.5 font-bold text-sm disabled:opacity-60"
                  style={{ background: 'var(--ops-orange)', color: '#fff', minHeight: 52 }}
                >
                  {isLoading ? 'Bidaltzen...' : 'Esteka bidali'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📬</div>
              <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--ops-text-pri)' }}>
                Egiaztatu zure posta
              </h2>
              <p className="text-sm" style={{ color: 'var(--ops-text-sec)' }}>
                Esteka bat bidali dizugu{' '}
                <strong style={{ color: 'var(--ops-text-pri)' }}>{email}</strong> helbidera. Esteka
                30 minututan iraungiko da.
              </p>
            </div>
          )}

          <div className="mt-5 text-center">
            <Link
              href="/login"
              className="text-sm hover:underline"
              style={{ color: 'var(--ops-text-sec)' }}
            >
              ← Itzuli saioa hasteko
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
