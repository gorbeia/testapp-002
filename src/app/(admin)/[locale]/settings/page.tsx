'use client';
import React, { useState, useCallback, useEffect } from 'react';
import { MaskedInput } from '@/components/ui/masked-input';
import { Dialog } from '@base-ui/react/dialog';
import { X, Plus, CreditCard, Building2, Power, Trash2, Edit2, Check } from 'lucide-react';

const TABS = ['Elkartea', 'Ordainketa', 'BEZ'];

// ── Dialog Component ─────────────────────────────────────────────────────────
function ProviderDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
          }}
        />
        <Dialog.Popup
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--adm-surface, #1a1d27)',
            border: '1px solid var(--adm-border, #2a2d3a)',
            borderRadius: 16,
            padding: 0,
            width: '90vw',
            maxWidth: 520,
            maxHeight: '85vh',
            overflow: 'auto',
            zIndex: 51,
            outline: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--adm-border, #2a2d3a)',
            }}
          >
            <Dialog.Title
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--adm-text-pri, #f8f9fa)',
                margin: 0,
              }}
            >
              {title}
            </Dialog.Title>
            <Dialog.Close
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: 'var(--adm-text-sec, #9ca3af)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          <div style={{ padding: 24 }}>{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Shared form helpers ─────────────────────────────────────────────────────────
function FormLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--adm-text-pri)',
        marginBottom: 6,
        ...style,
      }}
    >
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
        padding: '16px',
        background: 'var(--adm-surface)',
        border: '1px solid var(--adm-border)',
        borderRadius: 12,
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
        padding: '10px 24px',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        color: '#fff',
        background: saved ? '#22c55e' : '#e85d2f',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {saved ? '✓ Gordeta' : 'Gorde'}
    </button>
  );
}

// ── Tab 1: General (Association) ───────────────────────────────────────────────
function GeneralTab() {
  const [name, setName] = useState('');
  useEffect(() => {
    fetch('/api/admin/txosnak')
      .then((r) => r.json())
      .then((d: { association?: { name: string } }) => {
        if (d.association?.name) setName(d.association.name);
      })
      .catch(() => {});
  }, []);
  const [email, setEmail] = useState('kontaktua@elkartea.eus');
  const [phone, setPhone] = useState('');
  const [cif, setCif] = useState('');
  const [saved, setSaved] = useState(false);

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <FormLabel>Elkartearen izena</FormLabel>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width: '100%',
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
        <FormLabel>Kontaktua (e-maila)</FormLabel>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="kontaktua@elkartea.eus"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--adm-border)',
            background: 'var(--adm-surface)',
            color: 'var(--adm-text-pri)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <FormHint>Erabilera administratiboetarako</FormHint>
      </div>

      <div>
        <FormLabel>Telefono zenbakia</FormLabel>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="600 000 000"
          style={{
            width: '100%',
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
        <FormLabel>IFK / CIF</FormLabel>
        <input
          type="text"
          value={cif}
          onChange={(e) => setCif(e.target.value)}
          placeholder="A00000000"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--adm-border)',
            background: 'var(--adm-surface)',
            color: 'var(--adm-text-pri)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <FormHint>Elkartearen identifikazio fiskala</FormHint>
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

// ── Tab 2: Payment Providers ─────────────────────────────────────────────────
type ProviderType = 'stripe' | 'redsys';

interface PaymentCredentials {
  // Stripe
  stripePublic?: string;
  stripeSecret?: string;
  stripeWebhook?: string;
  // Redsys
  redsysMerchant?: string;
  redsysKey?: string;
  redsysTerminal?: string;
}

interface PaymentProvider {
  id: string;
  type: ProviderType;
  displayName: string;
  enabled: boolean;
  testMode: boolean;
  credentials: PaymentCredentials;
}

const PROVIDER_CONFIG = {
  stripe: {
    icon: CreditCard,
    name: 'Stripe',
    hint: 'Nazioarteko plataforma',
    color: '#635bff',
  },
  redsys: {
    icon: Building2,
    name: 'Redsys',
    hint: 'Banku espainiarrak',
    color: '#e85d2f',
  },
};

function ProviderCard({
  provider,
  onToggle,
  onEdit,
  onDelete,
  onTest,
}: {
  provider: PaymentProvider;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTest: () => Promise<{ ok: boolean; error?: string }>;
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const result = await onTest();
    setTestResult(result);
    setTesting(false);
  }

  const config = PROVIDER_CONFIG[provider.type];
  const Icon = config.icon;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        background: 'var(--adm-surface)',
        border: '1px solid var(--adm-border)',
        borderRadius: 12,
        transition: 'all 0.15s',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: config.color + '15',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={24} style={{ color: config.color }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--adm-text-pri)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {provider.displayName || config.name}
          {provider.testMode && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: '2px 8px',
                background: '#f59e0b20',
                color: '#f59e0b',
                borderRadius: 99,
              }}
            >
              Test
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 2 }}>
          {provider.enabled ? 'Gaituta' : 'Desgaituta'} · {config.hint}
        </div>
        {testResult && (
          <div
            style={{
              fontSize: 11,
              marginTop: 4,
              color: testResult.ok ? '#22c55e' : '#ef4444',
              fontWeight: 500,
            }}
          >
            {testResult.ok ? '✓ Konexioa egiaztatu da' : `✗ ${testResult.error ?? 'Errorea'}`}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={handleTest}
          disabled={testing}
          title="Konexioa probatu"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'var(--adm-surface-hi)',
            color: testing ? 'var(--adm-text-dim, #6b7280)' : 'var(--adm-text-sec)',
            cursor: testing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            transition: 'all 0.15s',
          }}
        >
          {testing ? '⏳' : '⚡'}
        </button>
        <button
          onClick={onToggle}
          title={provider.enabled ? 'Desgaitu' : 'Gaitu'}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: provider.enabled ? '#22c55e20' : 'var(--adm-surface-hi)',
            color: provider.enabled ? '#22c55e' : 'var(--adm-text-sec)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Power size={18} />
        </button>
        <button
          onClick={onEdit}
          title="Editatu"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'var(--adm-surface-hi)',
            color: 'var(--adm-text-sec)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={onDelete}
          title="Ezabatu"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'var(--adm-surface-hi)',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function ProviderForm({
  mode,
  initialData,
  onSave,
  onCancel,
}: {
  mode: 'add' | 'edit';
  initialData?: PaymentProvider;
  onSave: (provider: Omit<PaymentProvider, 'id'>) => void;
  onCancel: () => void;
}) {
  const [origin, setOrigin] = useState('');
  useEffect(() => setOrigin(window.location.origin), []);
  const [providerType, setProviderType] = useState<ProviderType>(initialData?.type || 'stripe');
  const [displayName, setDisplayName] = useState(initialData?.displayName || '');
  const [testMode, setTestMode] = useState(initialData?.testMode ?? true);
  const [stripePublic, setStripePublic] = useState(initialData?.credentials?.stripePublic || '');
  const [stripeSecret, setStripeSecret] = useState(initialData?.credentials?.stripeSecret || '');
  const [stripeWebhook, setStripeWebhook] = useState(initialData?.credentials?.stripeWebhook || '');
  const [redsysMerchant, setRedsysMerchant] = useState(
    initialData?.credentials?.redsysMerchant || ''
  );
  const [redsysKey, setRedsysKey] = useState(initialData?.credentials?.redsysKey || '');
  const [redsysTerminal, setRedsysTerminal] = useState(
    initialData?.credentials?.redsysTerminal || '1'
  );

  const handleSave = useCallback(() => {
    const credentials: PaymentCredentials =
      providerType === 'stripe'
        ? { stripePublic, stripeSecret, stripeWebhook }
        : { redsysMerchant, redsysKey, redsysTerminal };

    onSave({
      type: providerType,
      displayName: displayName || PROVIDER_CONFIG[providerType].name,
      enabled: initialData?.enabled ?? true,
      testMode,
      credentials,
    });
  }, [
    providerType,
    displayName,
    testMode,
    stripePublic,
    stripeSecret,
    stripeWebhook,
    redsysMerchant,
    redsysKey,
    redsysTerminal,
    initialData,
    onSave,
  ]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Provider type selection (only when adding) */}
      {mode === 'add' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {(Object.entries(PROVIDER_CONFIG) as [ProviderType, typeof PROVIDER_CONFIG.stripe][]).map(
            ([type, config]) => {
              const Icon = config.icon;
              const isSelected = providerType === type;
              return (
                <button
                  key={type}
                  onClick={() => setProviderType(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 16,
                    borderRadius: 12,
                    border: '2px solid',
                    borderColor: isSelected ? config.color : 'var(--adm-border)',
                    background: isSelected ? config.color + '10' : 'var(--adm-surface)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <Icon size={24} style={{ color: config.color, flexShrink: 0 }} />
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isSelected ? config.color : 'var(--adm-text-pri)',
                      }}
                    >
                      {config.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 2 }}>
                      {config.hint}
                    </div>
                  </div>
                </button>
              );
            }
          )}
        </div>
      )}

      {/* Display name */}
      <div>
        <FormLabel>Izena (aukerakoa)</FormLabel>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder={PROVIDER_CONFIG[providerType].name}
          style={{
            width: '100%',
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

      {/* Test mode toggle */}
      <ToggleRow
        label="Test modua"
        hint="Ordainketa errealak ez dira prozesatzen"
        checked={testMode}
        onChange={setTestMode}
      />

      {/* Stripe credentials */}
      {providerType === 'stripe' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: 'var(--adm-surface)',
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--adm-border)',
          }}
        >
          <div>
            <FormLabel>Publishable key</FormLabel>
            <FormHint>pk_test_… edo pk_live_…</FormHint>
            <div style={{ marginTop: 8 }}>
              <MaskedInput
                value={stripePublic}
                onChange={setStripePublic}
                placeholder="pk_test_..."
              />
            </div>
          </div>
          <div>
            <FormLabel>Secret key</FormLabel>
            <FormHint>sk_test_… edo sk_live_… — ez partekatu inoiz</FormHint>
            <div style={{ marginTop: 8 }}>
              <MaskedInput
                value={stripeSecret}
                onChange={setStripeSecret}
                placeholder="sk_test_..."
              />
            </div>
          </div>
          <div>
            <FormLabel>Webhook secret</FormLabel>
            <FormHint>whsec_… — ordainketa egoera jakinarazpenak</FormHint>
            <div style={{ marginTop: 8 }}>
              <MaskedInput
                value={stripeWebhook}
                onChange={setStripeWebhook}
                placeholder="whsec_..."
              />
            </div>
          </div>
          <div
            style={{
              background: 'var(--adm-surface-hi)',
              border: '1px solid var(--adm-border)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: 'var(--adm-text-sec)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>Webhook URL:</span>
            <code
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                background: 'var(--adm-surface)',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              {origin}/api/payments/webhook/stripe
            </code>
          </div>
        </div>
      )}

      {/* Redsys credentials */}
      {providerType === 'redsys' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            background: 'var(--adm-surface)',
            padding: 20,
            borderRadius: 12,
            border: '1px solid var(--adm-border)',
          }}
        >
          <div>
            <FormLabel>Merkatari kodea (FUC)</FormLabel>
            <FormHint>Bankuak emandako 9 digituko kodea</FormHint>
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                value={redsysMerchant}
                onChange={(e) => setRedsysMerchant(e.target.value)}
                placeholder="999008881"
                maxLength={9}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--adm-border)',
                  background: 'var(--adm-surface)',
                  color: 'var(--adm-text-pri)',
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <div>
            <FormLabel>Gako sekretua (SHA-256)</FormLabel>
            <FormHint>Redsys administraziotik lortu</FormHint>
            <div style={{ marginTop: 8 }}>
              <MaskedInput
                value={redsysKey}
                onChange={setRedsysKey}
                placeholder="sq7HjrUOBfKmC57m..."
              />
            </div>
          </div>
          <div>
            <FormLabel>Terminal zenbakia</FormLabel>
            <div style={{ marginTop: 8 }}>
              <input
                type="text"
                value={redsysTerminal}
                onChange={(e) => setRedsysTerminal(e.target.value)}
                placeholder="1"
                style={{
                  width: 96,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--adm-border)',
                  background: 'var(--adm-surface)',
                  color: 'var(--adm-text-pri)',
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, monospace',
                  outline: 'none',
                }}
              />
            </div>
          </div>
          <div
            style={{
              background: 'var(--adm-surface-hi)',
              border: '1px solid var(--adm-border)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: 'var(--adm-text-sec)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>URL notifikazioa:</span>
            <code
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                background: 'var(--adm-surface)',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: 11,
              }}
            >
              {origin}/api/payments/webhook/redsys
            </code>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--adm-text-sec)',
            background: 'var(--adm-surface-hi)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Utzi
        </button>
        <button
          onClick={handleSave}
          style={{
            padding: '10px 24px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            background: '#e85d2f',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Check size={18} />
          {mode === 'add' ? 'Gehitu hornitzailea' : 'Gorde aldaketak'}
        </button>
      </div>
    </div>
  );
}

function credentialsToApi(type: ProviderType, creds: PaymentCredentials): Record<string, string> {
  if (type === 'stripe') {
    return {
      publishableKey: creds.stripePublic ?? '',
      secretKey: creds.stripeSecret ?? '',
      webhookSecret: creds.stripeWebhook ?? '',
    };
  }
  return {
    merchantCode: creds.redsysMerchant ?? '',
    secretKey: creds.redsysKey ?? '',
    terminal: creds.redsysTerminal ?? '1',
  };
}

function PaymentProvidersTab() {
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<PaymentProvider | null>(null);
  const [associationId, setAssociationId] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        const assocId: string = session?.user?.associationId ?? '';
        setAssociationId(assocId);
        if (!assocId) return;
        const res = await fetch(`/api/associations/${assocId}/payment-providers`);
        if (!res.ok) throw new Error('Ezin izan dira hornitzaileak kargatu');
        const data: Array<{
          id: string;
          providerType: string;
          displayName: string | null;
          enabled: boolean;
          testMode: boolean;
        }> = await res.json();
        setProviders(
          data.map((p) => ({
            id: p.id,
            type: p.providerType.toLowerCase() as ProviderType,
            displayName: p.displayName ?? '',
            enabled: p.enabled,
            testMode: p.testMode,
            credentials: {},
          }))
        );
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Errorea gertatu da');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleAddProvider = useCallback(
    async (data: Omit<PaymentProvider, 'id'>) => {
      try {
        const res = await fetch(`/api/associations/${associationId}/payment-providers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerType: data.type.toUpperCase(),
            displayName: data.displayName || null,
            testMode: data.testMode,
            credentials: credentialsToApi(data.type, data.credentials),
            bizumEnabled: false,
          }),
        });
        if (!res.ok) throw new Error(`Errorea (${res.status})`);
        const created: {
          id: string;
          providerType: string;
          displayName: string | null;
          enabled: boolean;
          testMode: boolean;
        } = await res.json();
        setProviders((prev) => [
          ...prev,
          {
            id: created.id,
            type: created.providerType.toLowerCase() as ProviderType,
            displayName: created.displayName ?? '',
            enabled: created.enabled,
            testMode: created.testMode,
            credentials: {},
          },
        ]);
        setIsAddModalOpen(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Errorea gertatu da');
      }
    },
    [associationId]
  );

  const handleUpdateProvider = useCallback(
    async (data: Omit<PaymentProvider, 'id'>) => {
      if (!editingProvider) return;
      try {
        const patch: Record<string, unknown> = {
          displayName: data.displayName || null,
          testMode: data.testMode,
          enabled: data.enabled,
        };
        const hasNewCreds = Object.values(data.credentials).some(Boolean);
        if (hasNewCreds) patch.credentials = credentialsToApi(data.type, data.credentials);
        const res = await fetch(
          `/api/associations/${associationId}/payment-providers/${editingProvider.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
          }
        );
        if (!res.ok) throw new Error(`Errorea (${res.status})`);
        setProviders((prev) =>
          prev.map((p) =>
            p.id === editingProvider.id
              ? {
                  ...p,
                  displayName: data.displayName,
                  testMode: data.testMode,
                  enabled: data.enabled,
                }
              : p
          )
        );
        setEditingProvider(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Errorea gertatu da');
      }
    },
    [associationId, editingProvider]
  );

  const handleToggleProvider = useCallback(
    async (id: string) => {
      const provider = providers.find((p) => p.id === id);
      if (!provider) return;
      try {
        const res = await fetch(`/api/associations/${associationId}/payment-providers/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !provider.enabled }),
        });
        if (!res.ok) throw new Error(`Errorea (${res.status})`);
        setProviders((prev) => prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)));
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Errorea gertatu da');
      }
    },
    [associationId, providers]
  );

  const handleDeleteProvider = useCallback(
    async (id: string) => {
      if (!confirm('Hornitzailea ezabatu nahi duzu?')) return;
      try {
        const res = await fetch(`/api/associations/${associationId}/payment-providers/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(`Errorea (${res.status})`);
        setProviders((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Errorea gertatu da');
      }
    },
    [associationId]
  );

  const handleTestProvider = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(
          `/api/associations/${associationId}/payment-providers/${id}/validate`,
          { method: 'POST' }
        );
        const data: { ok: boolean; error?: string } = await res.json();
        return data;
      } catch {
        return { ok: false, error: 'Konexio errorea' };
      }
    },
    [associationId]
  );

  return (
    <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {apiError && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid #ef4444',
            borderRadius: 8,
            fontSize: 13,
            color: '#ef4444',
          }}
        >
          {apiError}
        </div>
      )}
      {/* Header with add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <FormLabel style={{ marginBottom: 4 }}>Konfiguratutako hornitzaileak</FormLabel>
          <div style={{ fontSize: 13, color: 'var(--adm-text-sec)' }}>
            {loading
              ? 'Kargatzen...'
              : `${providers.length} hornitzaile · ${providers.filter((p) => p.enabled).length} gaituta`}
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 16px',
            background: '#e85d2f',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Plus size={18} />
          Hornitzaile berria
        </button>
      </div>

      {/* Provider list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            onToggle={() => handleToggleProvider(provider.id)}
            onEdit={() => setEditingProvider(provider)}
            onDelete={() => handleDeleteProvider(provider.id)}
            onTest={() => handleTestProvider(provider.id)}
          />
        ))}

        {providers.length === 0 && (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              background: 'var(--adm-surface)',
              border: '1px dashed var(--adm-border)',
              borderRadius: 12,
            }}
          >
            <CreditCard
              size={40}
              style={{ color: 'var(--adm-text-sec)', marginBottom: 12, opacity: 0.5 }}
            />
            <div
              style={{
                fontSize: 14,
                color: 'var(--adm-text-pri)',
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              Ez dago ordainketa hornitzailerik konfiguratuta
            </div>
            <div style={{ fontSize: 13, color: 'var(--adm-text-sec)' }}>
              Gehitu Stripe edo Redsys ordainketak jaso ditzazun
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              style={{
                marginTop: 16,
                padding: '8px 16px',
                background: 'var(--adm-surface-hi)',
                color: 'var(--adm-text-pri)',
                fontSize: 14,
                fontWeight: 500,
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              + Gehitu hornitzailea
            </button>
          </div>
        )}
      </div>

      {/* Global save indicator */}
      {saved && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            background: '#22c55e20',
            border: '1px solid #22c55e40',
            borderRadius: 8,
            color: '#22c55e',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Check size={18} />
          Aldaketak ondo gorde dira
        </div>
      )}

      {/* Add Provider Modal */}
      <ProviderDialog
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        title="Hornitzaile berria"
      >
        <ProviderForm
          mode="add"
          onSave={handleAddProvider}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </ProviderDialog>

      {/* Edit Provider Modal */}
      <ProviderDialog
        open={editingProvider !== null}
        onOpenChange={(open) => !open && setEditingProvider(null)}
        title="Editatu hornitzailea"
      >
        {editingProvider && (
          <ProviderForm
            mode="edit"
            initialData={editingProvider}
            onSave={handleUpdateProvider}
            onCancel={() => setEditingProvider(null)}
          />
        )}
      </ProviderDialog>
    </div>
  );
}

// ── Tab 3: VAT/IVA Configuration ──────────────────────────────────────────────

interface VatType {
  id: string;
  label: string;
  percentage: string;
}

function VatTypeCard({
  vatType,
  onEdit,
  onDelete,
}: {
  vatType: VatType;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px',
        background: 'var(--adm-surface)',
        border: '1px solid var(--adm-border)',
        borderRadius: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--adm-text-pri)' }}>
          {vatType.label}
        </div>
        <div style={{ fontSize: 12, color: 'var(--adm-text-sec)', marginTop: 2 }}>
          {vatType.percentage}%
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onEdit}
          title="Editatu"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'var(--adm-surface-hi)',
            color: 'var(--adm-text-sec)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Edit2 size={18} />
        </button>
        <button
          onClick={onDelete}
          title="Ezabatu"
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: 'none',
            background: 'var(--adm-surface-hi)',
            color: 'var(--adm-text-sec)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s',
          }}
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

function VatTab() {
  const [vatTypes, setVatTypes] = useState<VatType[]>([]);
  const [ticketBaiEnabled, setTicketBaiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVat, setEditingVat] = useState<VatType | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formPercentage, setFormPercentage] = useState('');
  const [error, setError] = useState('');

  // Load VAT types on mount
  React.useEffect(() => {
    const loadVatTypes = async () => {
      try {
        const resp = await fetch('/api/vat-types');
        if (!resp.ok) throw new Error('Failed to load VAT types');
        const data = await resp.json();
        setVatTypes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Load association config for TicketBAI
    const loadAssociation = async () => {
      try {
        // Assuming associationId is available from session/context
        // For now, we'll skip this load
      } catch (err) {
        console.error(err);
      }
    };

    loadVatTypes();
    loadAssociation();
  }, []);

  const handleAddVat = () => {
    setEditingVat(null);
    setFormLabel('');
    setFormPercentage('');
    setError('');
    setDialogOpen(true);
  };

  const handleEditVat = (vat: VatType) => {
    setEditingVat(vat);
    setFormLabel(vat.label);
    setFormPercentage(vat.percentage);
    setError('');
    setDialogOpen(true);
  };

  const handleSaveVat = async () => {
    if (!formLabel || !formPercentage) {
      setError('Label and percentage are required');
      return;
    }

    try {
      const method = editingVat ? 'PATCH' : 'POST';
      const endpoint = editingVat ? `/api/vat-types/${editingVat.id}` : '/api/vat-types';
      const resp = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: formLabel, percentage: formPercentage }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }

      const result = await resp.json();
      if (editingVat) {
        setVatTypes(vatTypes.map((v) => (v.id === editingVat.id ? result : v)));
      } else {
        setVatTypes([...vatTypes, result]);
      }
      setDialogOpen(false);
    } catch (err) {
      setError(String(err));
    }
  };

  const handleDeleteVat = async (vatId: string) => {
    if (!confirm('Ezabatu nahi duzu?')) return;
    try {
      const resp = await fetch(`/api/vat-types/${vatId}`, { method: 'DELETE' });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text);
      }
      setVatTypes(vatTypes.filter((v) => v.id !== vatId));
    } catch (err) {
      alert('Error: ' + String(err));
    }
  };

  const handleToggleTicketBai = async (newValue: boolean) => {
    try {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();
      const associationId = session?.user?.associationId ?? '';
      const resp = await fetch('/api/associations/' + associationId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketBaiEnabled: newValue }),
      });
      if (!resp.ok) throw new Error('Failed to update');
      setTicketBaiEnabled(newValue);
    } catch (err) {
      alert('Error: ' + String(err));
    }
  };

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToggleRow
        label="TicketBAI gaitu"
        hint="Produktuak BEZ mota dute obligatorioa"
        checked={ticketBaiEnabled}
        onChange={handleToggleTicketBai}
      />

      {loading ? (
        <div style={{ color: 'var(--adm-text-sec)' }}>Kargatzen...</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {vatTypes.map((vat) => (
              <VatTypeCard
                key={vat.id}
                vatType={vat}
                onEdit={() => handleEditVat(vat)}
                onDelete={() => handleDeleteVat(vat.id)}
              />
            ))}
          </div>

          <button
            onClick={handleAddVat}
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: '#e85d2f',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Plus size={18} />
            Gehitu BEZ mota
          </button>
        </>
      )}

      <ProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingVat ? 'BEZ mota editatu' : 'BEZ mota gehitu'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <FormLabel>Izena</FormLabel>
            <input
              type="text"
              value={formLabel}
              onChange={(e) => setFormLabel(e.target.value)}
              placeholder="e.g. BEZ Murriztua"
              style={{
                width: '100%',
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
            <FormLabel>Ehunekoa</FormLabel>
            <input
              type="number"
              value={formPercentage}
              onChange={(e) => setFormPercentage(e.target.value)}
              placeholder="e.g. 10.00"
              min="0"
              max="100"
              step="0.01"
              style={{
                width: '100%',
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

          {error && <div style={{ color: '#ef4444', fontSize: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleSaveVat}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#fff',
                background: '#e85d2f',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Gorde
            </button>
            <button
              onClick={() => setDialogOpen(false)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--adm-text-pri)',
                background: 'var(--adm-surface-hi)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Utzi
            </button>
          </div>
        </div>
      </ProviderDialog>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AssociationSettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

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
        Elkartearen ezarpenak
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
              borderBottom: '2px solid',
              borderColor: activeTab === i ? '#e85d2f' : 'transparent',
              background: 'transparent',
              color: activeTab === i ? '#e85d2f' : 'var(--adm-text-sec)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <GeneralTab />}
      {activeTab === 1 && <PaymentProvidersTab />}
      {activeTab === 2 && <VatTab />}
    </div>
  );
}
