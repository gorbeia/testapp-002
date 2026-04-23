'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const MODES = [
  { id: 'food', label: 'Janaria', icon: '🍽', route: '/eu/counter' },
  { id: 'drinks', label: 'Edariak', icon: '🍺', route: '/eu/drinks' },
  { id: 'kitchen', label: 'Sukaldea', icon: '👨‍🍳', route: '/eu/kitchen' },
];

export default function PinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedMode, setSelectedMode] = useState(MODES[0]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [txosnaName, setTxosnaName] = useState('Txosna');
  const [slug, setSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlSlug = searchParams.get('slug');
    if (urlSlug) {
      setSlug(urlSlug);
      // Fetch txosna name for display
      fetch(`/api/txosnak/${urlSlug}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.name) setTxosnaName(data.name);
        })
        .catch(() => {});
    }
  }, [searchParams]);

  function pressDigit(d: string) {
    if (pin.length < 4) setPin((p) => p + d);
  }

  function backspace() {
    setPin((p) => p.slice(0, -1));
  }

  async function confirm() {
    if (pin.length < 4) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txosnaSlug: slug, pin }),
      });
      const data = await res.json();
      if (data.valid) {
        if (slug) sessionStorage.setItem('txosna_slug', slug);
        if (data.txosnaId) sessionStorage.setItem('txosna_id', data.txosnaId);
        router.push(selectedMode.route);
      } else {
        setError('PIN okerra. Saiatu berriro.');
        setPin('');
      }
    } catch {
      setError('Konexio errorea. Saiatu berriro.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="ops-theme min-h-screen flex items-center justify-center px-4 py-8">
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <ThemeToggle variant="ops" />
      </div>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-sm mb-1" style={{ color: 'var(--ops-text-sec)' }}>
            Txosna
          </div>
          <div
            className="text-xl font-black"
            style={{ fontFamily: 'var(--font-nunito), sans-serif', color: 'var(--ops-text-pri)' }}
          >
            {txosnaName}
          </div>
        </div>

        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--ops-surface)', border: '1px solid var(--ops-border)' }}
        >
          {/* Mode selector */}
          <div className="mb-5">
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--ops-text-sec)' }}
            >
              Aukeratu modua
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMode(m)}
                  className="rounded-xl py-3 flex flex-col items-center gap-1 transition-all"
                  style={{
                    background:
                      selectedMode.id === m.id ? 'var(--ops-orange)' : 'var(--ops-surface-hi)',
                    border: `1px solid ${selectedMode.id === m.id ? 'var(--ops-orange)' : 'var(--ops-border)'}`,
                    color: selectedMode.id === m.id ? '#fff' : 'var(--ops-text-sec)',
                  }}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span className="text-xs font-semibold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* PIN dots */}
          <div className="mb-4">
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--ops-text-sec)' }}
            >
              PIN sartu
            </div>
            <div className="flex justify-center gap-4 mb-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full transition-all"
                  style={{
                    background: i < pin.length ? 'var(--ops-orange)' : 'var(--ops-border-hi)',
                  }}
                />
              ))}
            </div>
            {error && (
              <div className="text-center text-xs mt-2" style={{ color: 'var(--ops-red)' }}>
                {error}
              </div>
            )}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((d, i) => (
              <button
                key={i}
                onClick={() => (d === '⌫' ? backspace() : d ? pressDigit(d) : undefined)}
                disabled={!d || isLoading}
                className="rounded-xl py-4 text-xl font-bold transition-opacity hover:opacity-80 active:scale-95 disabled:opacity-0"
                style={{
                  background: 'var(--ops-surface-hi)',
                  border: '1px solid var(--ops-border)',
                  color: 'var(--ops-text-pri)',
                  minHeight: 56,
                }}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Confirm */}
          <button
            onClick={confirm}
            disabled={pin.length < 4 || isLoading}
            className="w-full rounded-xl py-3.5 font-bold text-sm transition-opacity disabled:opacity-40"
            style={{ background: 'var(--ops-orange)', color: '#fff', minHeight: 52 }}
          >
            {isLoading ? 'Egiaztatzen...' : `Sartu — ${selectedMode.icon} ${selectedMode.label}`}
          </button>
        </div>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm" style={{ color: 'var(--ops-text-dim)' }}>
            ← Itzuli
          </Link>
        </div>
      </div>
    </div>
  );
}
