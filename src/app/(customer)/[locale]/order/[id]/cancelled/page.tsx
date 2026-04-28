'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CustomerHeader } from '@/components/layout/customer-header';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function PaymentCancelledPage() {
  const params = useParams();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuSlug, setMenuSlug] = useState('');

  const orderId = Array.isArray(params.id) ? params.id[0] : (params.id ?? '');
  const locale = Array.isArray(params.locale) ? params.locale[0] : (params.locale ?? '');

  useEffect(() => {
    const slug = localStorage.getItem('txosna_slug');
    if (slug) setMenuSlug(slug);
  }, []);

  async function handleRetry() {
    setRetrying(true);
    setError(null);
    try {
      const returnUrl = `${window.location.origin}/${locale}/order/${orderId}`;
      const res = await fetch('/api/payments/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, returnUrl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Errorea (${res.status})`);
      }
      const session = await res.json();
      window.location.href = session.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errorea gertatu da');
      setRetrying(false);
    }
  }

  return (
    <div className="cust-theme" style={{ minHeight: '100vh', background: 'var(--cust-bg)' }}>
      <CustomerHeader txosnaName="Txosna" status="OPEN" right={<ThemeToggle variant="cust" />} />
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          padding: '60px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        <div style={{ fontSize: 52 }}>❌</div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: 'var(--cust-text-pri, #111)',
              marginBottom: 8,
            }}
          >
            Ordainketa utzi da
          </div>
          <div style={{ fontSize: 14, color: 'var(--cust-text-sec, #6b7280)' }}>
            Zure eskaera gordeta dago. Berriro saiatu edo utzi dezakezu.
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid #ef4444',
              borderRadius: 10,
              padding: '12px 14px',
              fontSize: 13,
              color: '#ef4444',
              width: '100%',
              textAlign: 'center',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
          <button
            onClick={handleRetry}
            disabled={retrying}
            style={{
              background: 'var(--cust-primary, #e85d2f)',
              border: 'none',
              borderRadius: 12,
              padding: '15px 20px',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              cursor: retrying ? 'not-allowed' : 'pointer',
              opacity: retrying ? 0.7 : 1,
            }}
          >
            {retrying ? 'Kargatzen...' : '💳 Berriro saiatu'}
          </button>

          <Link
            href={menuSlug ? `/eu/${menuSlug}` : '/'}
            style={{
              background: 'var(--cust-surface, #fff)',
              border: '1px solid var(--cust-border, #e5e7eb)',
              borderRadius: 12,
              padding: '15px 20px',
              color: 'var(--cust-text-sec, #6b7280)',
              fontSize: 15,
              fontWeight: 600,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            ← Menura itzuli
          </Link>
        </div>
      </div>
    </div>
  );
}
