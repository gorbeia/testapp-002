'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

type Step = 1 | 2;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState('');
  const [association, setAssociation] = useState<{ id: string; name: string } | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleAssociationSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/auth/association?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Elkartea ez da aurkitu');
        return;
      }
      setAssociation(data);
      setStep(2);
    } catch {
      setError('Konexio errorea. Saiatu berriro.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    // Simulate network delay for realistic prototype feel
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsLoading(false);
    router.push('/eu/pin');
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--ops-surface-hi)',
    border: '1px solid var(--ops-border)',
    color: 'var(--ops-text-pri)',
  };

  return (
    <div className="ops-theme min-h-screen flex items-center justify-center px-4">
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <ThemeToggle variant="ops" />
      </div>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="text-3xl font-black mb-2 tracking-tight"
            style={{ fontFamily: 'var(--font-nunito), sans-serif', color: 'var(--ops-text-pri)' }}
          >
            Txosnabai
          </div>
          <div className="text-sm font-medium" style={{ color: 'var(--ops-text-sec)' }}>
            {step === 2 && association ? association.name : 'Saioa hasteko, hautatu zure elkartea'}
          </div>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
          {([1, 2] as Step[]).map((s) => (
            <div
              key={s}
              style={{
                width: 32,
                height: 4,
                borderRadius: 99,
                background: s <= step ? 'var(--ops-orange)' : 'var(--ops-border)',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{
            background: 'var(--ops-surface)',
            border: '1px solid var(--ops-border)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          }}
        >
          {step === 1 ? (
            <>
              <h1
                className="text-xl font-bold mb-6"
                style={{
                  fontFamily: 'var(--font-nunito), sans-serif',
                  color: 'var(--ops-text-pri)',
                }}
              >
                Zein elkartekoa zara?
              </h1>
              <form onSubmit={handleAssociationSubmit} className="space-y-5">
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--ops-text-sec)' }}
                  >
                    Elkartearen izena
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Adib.: Bilbao Zaharra"
                    required
                    disabled={isLoading}
                    className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all disabled:opacity-50"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ops-orange)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ops-border)';
                    }}
                  />
                </div>

                {error && (
                  <div
                    className="text-sm rounded-lg px-4 py-3"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="w-full rounded-xl py-4 font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'var(--ops-orange)',
                    color: '#fff',
                    minHeight: 56,
                    letterSpacing: '0.01em',
                  }}
                >
                  {isLoading ? 'Bilatzen...' : 'Jarraitu →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1
                className="text-xl font-bold mb-1"
                style={{
                  fontFamily: 'var(--font-nunito), sans-serif',
                  color: 'var(--ops-text-pri)',
                }}
              >
                Saioa hasi
              </h1>
              {association && (
                <div className="text-sm mb-6" style={{ color: 'var(--ops-text-sec)' }}>
                  {association.name}
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--ops-text-sec)' }}
                  >
                    Posta elektronikoa
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="zure@posta.eus"
                    required
                    disabled={isLoading}
                    className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all disabled:opacity-50"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ops-orange)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ops-border)';
                    }}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-semibold mb-2"
                    style={{ color: 'var(--ops-text-sec)' }}
                  >
                    Pasahitza
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all disabled:opacity-50"
                    style={inputStyle}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ops-orange)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'var(--ops-border)';
                    }}
                  />
                </div>

                {error && (
                  <div
                    className="text-sm rounded-lg px-4 py-3 flex items-center gap-2"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#fca5a5',
                    }}
                  >
                    <span>⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-xl py-4 font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: 'var(--ops-orange)',
                    color: '#fff',
                    minHeight: 56,
                    letterSpacing: '0.01em',
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Sartzen...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Saioa hasi <span>→</span>
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--ops-border)' }}>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setStep(1);
                      setError(null);
                    }}
                    className="text-sm font-medium transition-colors hover:underline"
                    style={{
                      color: 'var(--ops-text-sec)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    ← Elkartea aldatu
                  </button>
                  <Link
                    href="/reset-password"
                    className="text-sm font-medium transition-colors hover:underline"
                    style={{ color: 'var(--ops-text-sec)' }}
                  >
                    Pasahitza ahaztu?
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Register link */}
        <div className="mt-6 text-center">
          <Link
            href="/register"
            className="text-sm font-semibold transition-colors"
            style={{ color: 'var(--ops-orange)' }}
          >
            Konturik ez duzu? Erregistratu →
          </Link>
        </div>
      </div>
    </div>
  );
}
