'use client';
import { useState } from 'react';
import Link from 'next/link';

const STEPS = [
  { id: 1, title: 'Txosna datuak', desc: 'Izena, irudia eta deskribapena konfiguratu', icon: '🏠' },
  { id: 2, title: 'Menua sortu', desc: 'Kategoriak eta produktuak gehitu', icon: '🍽' },
  { id: 3, title: 'Boluntarioak', desc: 'Taldekideak gonbidatu eta rolak ezarri', icon: '👥' },
  { id: 4, title: 'Ordainketa', desc: 'Ordainketa metodoak eta prezioak konfiguratu', icon: '💳' },
  {
    id: 5,
    title: 'Probak egin',
    desc: 'Dena behar bezala funtzionatzen duela egiaztatu',
    icon: '✅',
  },
];

export default function OnboardingPage() {
  const [completed, setCompleted] = useState<number[]>([1]);

  const toggle = (id: number) =>
    setCompleted((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const allDone = completed.length === STEPS.length;

  return (
    <div style={{ padding: '32px 32px 60px', maxWidth: 600 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, color: 'var(--adm-text-sec)', marginBottom: 4 }}>
          Ongi etorri
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 26,
            fontWeight: 800,
            color: 'var(--adm-text-pri)',
            margin: '0 0 8px',
          }}
        >
          Konfigurazio gida
        </h1>
        <p style={{ fontSize: 14, color: 'var(--adm-text-sec)' }}>
          Jarraitu urrats hauek zure txosna konfiguratzeko.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <div
            style={{
              flex: 1,
              height: 6,
              background: 'var(--adm-surface-hi)',
              borderRadius: 99,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(completed.length / STEPS.length) * 100}%`,
                height: '100%',
                background: '#e85d2f',
                borderRadius: 99,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--adm-text-sec)',
              whiteSpace: 'nowrap',
            }}
          >
            {completed.length}/{STEPS.length}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STEPS.map((step) => {
          const done = completed.includes(step.id);
          return (
            <div
              key={step.id}
              style={{
                background: 'var(--adm-surface)',
                border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : 'var(--adm-border)'}`,
                borderRadius: 12,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => toggle(step.id)}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: done ? 'rgba(34,197,94,0.15)' : 'var(--adm-surface-hi)',
                  border: `2px solid ${done ? '#22c55e' : 'var(--adm-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: done ? 18 : 20,
                  flexShrink: 0,
                  transition: 'all 0.2s',
                }}
              >
                {done ? '✓' : step.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: done ? 'var(--adm-text-sec)' : 'var(--adm-text-pri)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}
                >
                  {step.title}
                </div>
                <div style={{ fontSize: 13, color: 'var(--adm-text-dim)', marginTop: 1 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div
          style={{
            marginTop: 24,
            background: 'rgba(34,197,94,0.1)',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Dena prest!</div>
          <Link
            href="/eu/dashboard"
            style={{
              display: 'inline-block',
              background: '#22c55e',
              borderRadius: 10,
              padding: '10px 24px',
              color: '#ffffff',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: 14,
            }}
          >
            Dashboardera joan →
          </Link>
        </div>
      )}
    </div>
  );
}
