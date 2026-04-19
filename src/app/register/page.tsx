'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PrototypeNav } from '@/components/prototype-nav';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: '', email: '', password: '', txosna: '', event: '' });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) {
      setStep((s) => s + 1);
      return;
    }
    router.push('/eu/onboarding');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        fontFamily: 'var(--font-dm-sans, system-ui, sans-serif)',
      }}
    >
      <PrototypeNav />
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <ThemeToggle variant="ops" />
      </div>
      <div style={{ width: '100%', maxWidth: 420, margin: '40px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              fontFamily: 'var(--font-nunito, sans-serif)',
              fontSize: 24,
              fontWeight: 800,
              color: '#111',
              marginBottom: 4,
            }}
          >
            Txosna
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>Sortu zure kontua</div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, justifyContent: 'center' }}>
          {[1, 2].map((s) => (
            <div
              key={s}
              style={{
                width: 32,
                height: 4,
                borderRadius: 99,
                background: s <= step ? '#e85d2f' : '#e5e7eb',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>

        <div
          style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: 24 }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111', marginBottom: 20 }}>
            {step === 1 ? 'Kontuaren datuak' : 'Txosna informazioa'}
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {step === 1 ? (
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 5,
                    }}
                  >
                    Izena
                  </label>
                  <input
                    value={form.name}
                    onChange={update('name')}
                    placeholder="Zure izena"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 5,
                    }}
                  >
                    Posta elektronikoa
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={update('email')}
                    placeholder="zure@posta.eus"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 5,
                    }}
                  >
                    Pasahitza
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={update('password')}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 5,
                    }}
                  >
                    Txosna izena
                  </label>
                  <input
                    value={form.txosna}
                    onChange={update('txosna')}
                    placeholder="Adib.: Bilbao Zaharra"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#6b7280',
                      marginBottom: 5,
                    }}
                  >
                    Jaialdia
                  </label>
                  <input
                    value={form.event}
                    onChange={update('event')}
                    placeholder="Adib.: Aste Nagusia 2026"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      fontSize: 14,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </>
            )}

            <div
              className="text-xs rounded-lg px-3 py-2"
              style={{
                background: '#fff7ed',
                color: '#c2410c',
                fontSize: 12,
                padding: '8px 12px',
                borderRadius: 8,
              }}
            >
              Proto modua: edozein daturekin erregistratu daiteke
            </div>

            <button
              type="submit"
              style={{
                background: '#e85d2f',
                border: 'none',
                borderRadius: 10,
                padding: '12px',
                color: '#fff',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                minHeight: 48,
              }}
            >
              {step === 1 ? 'Hurrengoa →' : 'Kontua sortu'}
            </button>
          </form>

          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Link href="/login" style={{ fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>
              Kontu bat baduzu? Saioa hasi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
