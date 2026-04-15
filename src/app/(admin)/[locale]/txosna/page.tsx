'use client';
import React, { useState } from 'react';
import { MOCK_TXOSNA } from '@/lib/mock-data';

const TABS = ['Orokorra', 'Ordainketa', 'Eskaerak', 'QR kodea'];

// ── Shared form helpers ───────────────────────────────────────────────────────
function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--adm-text-pri)', marginBottom: 6 }}>
      {children}
    </div>
  );
}

function FormHint({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 4 }}>{children}</div>;
}

function ToggleRow({
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
        padding: '14px 16px',
        background: 'var(--adm-surface)',
        border: '1px solid var(--adm-border)',
        borderRadius: 10,
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
          flexShrink: 0,
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
            display: 'block',
          }}
        />
      </button>
    </div>
  );
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        alignSelf: 'flex-start',
        background: saved ? '#22c55e' : '#e85d2f',
        border: 'none',
        borderRadius: 8,
        padding: '10px 24px',
        color: '#fff',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      {saved ? '✓ Gordeta' : 'Gorde'}
    </button>
  );
}

// ── Tab 1: Payment ────────────────────────────────────────────────────────────
// Mock association-level payment providers (in real app, fetch from API)
const MOCK_ASSOCIATION_PROVIDERS = [
  {
    id: 'prov-1',
    type: 'stripe' as const,
    displayName: 'Stripe (test)',
    enabled: true,
    testMode: true,
  },
  {
    id: 'prov-2',
    type: 'redsys' as const,
    displayName: 'Redsys (produkzioa)',
    enabled: true,
    testMode: false,
  },
];

function PaymentTab() {
  const [methods, setMethods] = React.useState<{ cash: boolean; card: boolean }>({
    cash: true,
    card: true,
  });
  const [enabledProviders, setEnabledProviders] = React.useState<string[]>(['prov-1']);
  const [saved, setSaved] = React.useState(false);

  const toggleMethod = (k: keyof typeof methods) =>
    setMethods((prev) => ({ ...prev, [k]: !prev[k] }));

  const toggleProvider = (providerId: string) => {
    setEnabledProviders((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );
  };

  const hasAssociationProviders = MOCK_ASSOCIATION_PROVIDERS.length > 0;

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <FormLabel>Ordainketa metodoak</FormLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleRow
            label="Efektiboa"
            hint="Eskudiruz ordaintzea"
            checked={methods.cash}
            onChange={() => toggleMethod('cash')}
          />
          <ToggleRow
            label="Txartela / Online"
            hint="Txartel edo lineako ordainketa"
            checked={methods.card}
            onChange={() => toggleMethod('card')}
          />
        </div>
      </div>

      {methods.card && (
        <div
          style={{
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
            padding: '20px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div>
            <FormLabel>Gaitutako ordainketa hornitzaileak</FormLabel>
            <FormHint>Elkartean konfiguratutako hornitzaileak</FormHint>

            {!hasAssociationProviders ? (
              <div
                style={{
                  marginTop: 12,
                  padding: '16px',
                  background: 'var(--adm-surface-hi)',
                  borderRadius: 8,
                  border: '1px dashed var(--adm-border)',
                }}
              >
                <div style={{ fontSize: 13, color: 'var(--adm-text-sec)' }}>
                  Ez dago ordainketa hornitzailerik konfiguratuta elkartean.
                </div>
                <a
                  href="/eu/settings"
                  style={{
                    display: 'inline-block',
                    marginTop: 8,
                    fontSize: 13,
                    color: 'var(--adm-text-pri)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  → Konfiguratu hornitzaileak elkartearen ezarpenetan
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {MOCK_ASSOCIATION_PROVIDERS.map((provider) => {
                  const isEnabled = enabledProviders.includes(provider.id);
                  const providerIcons: Record<string, string> = {
                    stripe: '◼',
                    redsys: '🏦',
                  };
                  return (
                    <div
                      key={provider.id}
                      onClick={() => toggleProvider(provider.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        background: isEnabled ? 'var(--adm-surface)' : 'var(--adm-surface-hi)',
                        border: `2px solid ${isEnabled ? '#e85d2f' : 'var(--adm-border)'}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 20 }}>{providerIcons[provider.type] || '💳'}</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: isEnabled ? '#e85d2f' : 'var(--adm-text-pri)',
                          }}
                        >
                          {provider.displayName}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--adm-text-sec)' }}>
                          {provider.testMode ? '🧪 Test modua' : '✅ Produkzioa'}
                        </div>
                      </div>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: isEnabled ? '#e85d2f' : 'var(--adm-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        {isEnabled ? '✓' : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {hasAssociationProviders && enabledProviders.length === 0 && methods.card && (
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--adm-surface-hi)',
                borderRadius: 8,
                border: '1px solid var(--adm-border)',
                fontSize: 12,
                color: 'var(--adm-text-sec)',
              }}
            >
              ⚠️ Gutxienez ordainketa hornitzaile bat gaitu behar duzu txartel ordainketak
              onartzeko.
            </div>
          )}
        </div>
      )}

      <SaveButton
        saved={saved}
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      />
    </div>
  );
}

// ── Tab 2: Orders ─────────────────────────────────────────────────────────────
function OrdersTab() {
  const [counterSetup, setCounterSetup] = React.useState<'SINGLE' | 'SEPARATE'>('SEPARATE');
  const [channels, setChannels] = React.useState({
    counter: true,
    phone: true,
    selfService: false,
  });
  const [maxItems, setMaxItems] = React.useState(20);
  const [printerEnabled, setPrinterEnabled] = React.useState(false);
  const [printerProtocol, setPrinterProtocol] = React.useState<'ESC_POS' | 'STAR'>('ESC_POS');
  const [printerIp, setPrinterIp] = React.useState('');
  const [printerPort, setPrinterPort] = React.useState('9100');
  const [saved, setSaved] = React.useState(false);

  const toggleChannel = (k: keyof typeof channels) =>
    setChannels((prev) => ({ ...prev, [k]: !prev[k] }));

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <FormLabel>Mostradore konfigurazioa</FormLabel>
        <FormHint>Jakiak eta edariak nola kudeatzen diren</FormHint>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          {(['SINGLE', 'SEPARATE'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => setCounterSetup(opt)}
              style={{
                padding: '16px 14px',
                borderRadius: 10,
                border: `2px solid ${counterSetup === opt ? '#e85d2f' : 'var(--adm-border)'}`,
                background: counterSetup === opt ? 'var(--adm-surface)' : 'var(--adm-surface-hi)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>
                {opt === 'SINGLE' ? '🍽' : '🍽🍺'}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: opt === 'SINGLE' ? '#e85d2f' : 'var(--adm-text-pri)',
                }}
              >
                {opt === 'SINGLE' ? 'Bakarra' : 'Bereizita'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 2 }}>
                {opt === 'SINGLE'
                  ? 'Mostradore bakarra janaria eta edarientzat'
                  : 'Mostradore independenteak janaria eta edarientzat'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <FormLabel>Eskaerak jaso nondik</FormLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ToggleRow
            label="Mostradore zuzenean"
            hint="Boluntarioek eskuz sartu"
            checked={channels.counter}
            onChange={() => toggleChannel('counter')}
          />
          <ToggleRow
            label="Telefonoa → Mostradore"
            hint="Deitu eta mostradoreraino ekarri"
            checked={channels.phone}
            onChange={() => toggleChannel('phone')}
          />
          <ToggleRow
            label="Norberak eskatu (QR)"
            hint="Bezeroak bere telefonotik eskatu"
            checked={channels.selfService}
            onChange={() => toggleChannel('selfService')}
          />
        </div>
      </div>

      <div>
        <FormLabel>Gehieneko elementu kopurua eskaerako</FormLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="number"
            value={maxItems}
            onChange={(e) => setMaxItems(Number(e.target.value))}
            min={1}
            max={99}
            style={{
              width: 80,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--adm-border)',
              background: 'var(--adm-surface)',
              color: 'var(--adm-text-pri)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <span style={{ fontSize: 13, color: 'var(--adm-text-sec)' }}>elementu / eskaera</span>
        </div>
        <FormHint>0 = mugarik gabe</FormHint>
      </div>

      <SaveButton
        saved={saved}
        onClick={() => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      />
    </div>
  );
}

// ── Tab 3: QR code ────────────────────────────────────────────────────────────
function QrTab() {
  const [copied, setCopied] = React.useState(false);
  const mockUrl = 'https://txosna.app/eu/aste-nagusia-2026';

  const handleCopy = () => {
    navigator.clipboard?.writeText(mockUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div
        style={{
          background: 'var(--adm-surface)',
          border: '1px solid var(--adm-border)',
          borderRadius: 16,
          padding: 32,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        {/* QR placeholder */}
        <div
          style={{
            width: 180,
            height: 180,
            background: 'var(--adm-surface-hi)',
            border: '2px dashed var(--adm-border)',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 48 }}>⬛</div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--adm-text-sec)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            QR kodea
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-text-pri)', marginBottom: 2 }}
          >
            Aste Nagusia 2026
          </div>
          <div style={{ fontSize: 12, color: 'var(--adm-text-sec)' }}>
            Bezeroak QR hau eskaneatu eta zuzenean eskatu dezakete
          </div>
        </div>
        <button
          style={{
            background: '#e85d2f',
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ⬇ Deskargatu QR
        </button>
      </div>

      <div>
        <FormLabel>Eskaerako esteka</FormLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            readOnly
            value={mockUrl}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--adm-border)',
              fontSize: 13,
              color: 'var(--adm-text-pri)',
              background: 'var(--adm-surface-hi)',
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={handleCopy}
            style={{
              background: copied ? '#22c55e' : 'var(--adm-surface-hi)',
              border: '1px solid var(--adm-border)',
              borderRadius: 8,
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: copied ? '#fff' : 'var(--adm-text-pri)',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Kopiatuta' : 'Kopiatu'}
          </button>
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
          style={{ fontSize: 13, fontWeight: 600, color: 'var(--adm-text-pri)', marginBottom: 10 }}
        >
          QR berria sortu
        </div>
        <p
          style={{ fontSize: 13, color: 'var(--adm-text-sec)', marginBottom: 14, lineHeight: 1.5 }}
        >
          QR kodea berriro sortzeak esteka zaharra desaktibatuko du. QR inprimatutako materiala
          baduzu, ezin izango da erabili.
        </p>
        <button
          style={{
            background: 'var(--adm-surface-hi)',
            border: '1px solid var(--adm-border)',
            borderRadius: 8,
            padding: '8px 16px',
            fontSize: 13,
            color: 'var(--adm-text-pri)',
            cursor: 'pointer',
          }}
        >
          🔄 QR berria sortu
        </button>
      </div>
    </div>
  );
}

export default function TxosnaConfigPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState(MOCK_TXOSNA.status);
  const [waitMin, setWaitMin] = useState(MOCK_TXOSNA.waitMinutes ?? 10);
  const [pin, setPin] = useState(MOCK_TXOSNA.pin);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ padding: '32px 32px 60px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-nunito, sans-serif)',
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--adm-text-pri)',
          marginBottom: 20,
        }}
      >
        Txosna konfigurazioa
      </h1>

      {/* Tabs */}
      <div
        style={{ display: 'flex', borderBottom: '1px solid var(--adm-border)', marginBottom: 24 }}
      >
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              borderBottom: `2px solid ${activeTab === i ? '#e85d2f' : 'transparent'}`,
              background: 'transparent',
              color: activeTab === i ? '#e85d2f' : 'var(--adm-text-sec)',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--adm-text-pri)',
                marginBottom: 6,
              }}
            >
              Egoera
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['OPEN', 'PAUSED', 'CLOSED'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: `2px solid ${status === s ? '#e85d2f' : 'var(--adm-border)'}`,
                    background: status === s ? 'var(--adm-surface)' : 'var(--adm-surface-hi)',
                    color: status === s ? '#e85d2f' : 'var(--adm-text-pri)',
                  }}
                >
                  {s === 'OPEN' ? 'Irekita' : s === 'PAUSED' ? 'Geldituta' : 'Itxita'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--adm-text-pri)',
                marginBottom: 6,
              }}
            >
              Itxaron denbora (minutuak)
            </label>
            <input
              type="number"
              value={waitMin}
              onChange={(e) => setWaitMin(Number(e.target.value))}
              min={0}
              max={120}
              style={{
                width: 120,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--adm-border)',
                background: 'var(--adm-surface)',
                color: 'var(--adm-text-pri)',
                fontSize: 14,
                outline: 'none',
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
                marginBottom: 6,
              }}
            >
              Boluntario PIN
            </label>
            <input
              type="text"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              pattern="[0-9]*"
              style={{
                width: 120,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid var(--adm-border)',
                background: 'var(--adm-surface)',
                color: 'var(--adm-text-pri)',
                fontSize: 14,
                outline: 'none',
                letterSpacing: '0.2em',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            />
          </div>
          <button
            onClick={handleSave}
            style={{
              alignSelf: 'flex-start',
              background: saved ? '#22c55e' : '#e85d2f',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {saved ? '✓ Gordeta' : 'Gorde'}
          </button>
        </div>
      )}

      {activeTab === 1 && <PaymentTab />}
      {activeTab === 2 && <OrdersTab />}
      {activeTab === 3 && <QrTab />}
    </div>
  );
}
