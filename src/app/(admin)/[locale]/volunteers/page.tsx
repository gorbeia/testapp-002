'use client';
import { useState } from 'react';
import { MOCK_VOLUNTEERS, MOCK_TXOSNA, type MockVolunteer } from '@/lib/mock-data';

function AddVolunteerModal({
  onSave,
  onClose,
}: {
  onSave: (v: MockVolunteer) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'VOLUNTEER'>('VOLUNTEER');

  const handleSave = () => {
    if (!name || !email) return;
    onSave({ id: 'vol-' + Date.now(), name, email, role, active: true });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--adm-surface)',
          border: '1px solid var(--adm-border)',
          borderRadius: 16,
          padding: '24px 24px 20px',
          width: '100%',
          maxWidth: 420,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--adm-text-pri)',
            margin: '0 0 20px',
          }}
        >
          Boluntario berria
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--adm-text-pri)',
                marginBottom: 5,
              }}
            >
              Izena *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Izena eta abizena"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--adm-border)',
                background: 'var(--adm-surface)',
                color: 'var(--adm-text-pri)',
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
                color: 'var(--adm-text-pri)',
                marginBottom: 5,
              }}
            >
              Posta elektronikoa *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="izena@adibidea.eus"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--adm-border)',
                background: 'var(--adm-surface)',
                color: 'var(--adm-text-pri)',
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
                color: 'var(--adm-text-pri)',
                marginBottom: 8,
              }}
            >
              Rola
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['VOLUNTEER', 'ADMIN'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `2px solid ${role === r ? '#e85d2f' : 'var(--adm-border)'}`,
                    background: role === r ? 'var(--adm-surface)' : 'var(--adm-surface-hi)',
                    color: role === r ? '#e85d2f' : 'var(--adm-text-pri)',
                    transition: 'all 0.15s',
                  }}
                >
                  {r === 'ADMIN' ? 'Admin' : 'Boluntario'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--adm-surface-hi)',
              border: '1px solid var(--adm-border)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 14,
              cursor: 'pointer',
              color: 'var(--adm-text-pri)',
            }}
          >
            Utzi
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !email}
            style={{
              background: !name || !email ? 'var(--adm-surface-hi)' : '#e85d2f',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              color: !name || !email ? 'var(--adm-text-sec)' : '#fff',
              cursor: !name || !email ? 'not-allowed' : 'pointer',
            }}
          >
            Gehitu
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<MockVolunteer[]>(MOCK_VOLUNTEERS);
  const [showAdd, setShowAdd] = useState(false);

  const toggleActive = (id: string) => {
    setVolunteers((prev) => prev.map((v) => (v.id === id ? { ...v, active: !v.active } : v)));
  };

  const activeCount = volunteers.filter((v) => v.active).length;
  const adminCount = volunteers.filter((v) => v.role === 'ADMIN' && v.active).length;

  return (
    <div style={{ padding: '32px 32px 60px' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h1
            style={{
              fontFamily: 'var(--font-nunito, sans-serif)',
              fontSize: 26,
              fontWeight: 800,
              color: 'var(--adm-text-pri)',
              margin: '0 0 4px',
            }}
          >
            Boluntarioak
          </h1>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: '#e85d2f',
              border: 'none',
              borderRadius: 8,
              padding: '10px 16px',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Gehitu
          </button>
        </div>
        <div style={{ fontSize: 14, color: 'var(--adm-text-sec)' }}>
          {MOCK_TXOSNA.name} · {activeCount} aktibo / {volunteers.length} guztira
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--adm-text-sec)',
              marginBottom: 6,
            }}
          >
            Aktibo
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 28,
              fontWeight: 800,
              color: '#22c55e',
            }}
          >
            {activeCount}
          </div>
        </div>
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--adm-text-sec)',
              marginBottom: 6,
            }}
          >
            Admin
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 28,
              fontWeight: 800,
              color: '#3b82f6',
            }}
          >
            {adminCount}
          </div>
        </div>
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
            padding: '16px 18px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--adm-text-sec)',
              marginBottom: 6,
            }}
          >
            Inaktibo
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--adm-text-sec)',
            }}
          >
            {volunteers.length - activeCount}
          </div>
        </div>
      </div>

      {/* Volunteers list */}
      <div
        style={{
          background: 'var(--adm-surface)',
          border: '1px solid var(--adm-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--adm-border)',
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr 1fr 100px',
            gap: 16,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--adm-text-sec)',
          }}
        >
          <span>Izena</span>
          <span>Email</span>
          <span>Rola</span>
          <span>Egoera</span>
          <span></span>
        </div>
        {volunteers.map((v) => (
          <div
            key={v.id}
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--adm-border)',
              display: 'grid',
              gridTemplateColumns: '2fr 2fr 1fr 1fr 100px',
              gap: 16,
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-text-pri)' }}>
                {v.name}
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--adm-text-sec)' }}>{v.email}</div>
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 99,
                  background:
                    v.role === 'ADMIN' ? 'rgba(59,130,246,0.15)' : 'var(--adm-surface-hi)',
                  color: v.role === 'ADMIN' ? '#3b82f6' : 'var(--adm-text-pri)',
                }}
              >
                {v.role === 'ADMIN' ? 'Admin' : 'Boluntario'}
              </span>
            </div>
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 99,
                  background: v.active ? 'rgba(34,197,94,0.15)' : 'var(--adm-surface-hi)',
                  color: v.active ? '#22c55e' : 'var(--adm-text-sec)',
                }}
              >
                {v.active ? 'Aktibo' : 'Inaktibo'}
              </span>
            </div>
            <div>
              <button
                onClick={() => toggleActive(v.id)}
                style={{
                  background: 'none',
                  border: '1px solid var(--adm-border)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  color: 'var(--adm-text-pri)',
                }}
              >
                {v.active ? 'Desaktibatu' : 'Aktibatu'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add volunteer modal */}
      {showAdd && (
        <AddVolunteerModal
          onSave={(v) => {
            setVolunteers((prev) => [...prev, v]);
            setShowAdd(false);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}
