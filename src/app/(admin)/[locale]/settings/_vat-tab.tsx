'use client';
import React, { useState } from 'react';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { ProviderDialog } from './_provider-dialog';
import { FormLabel, FormHint, ToggleRow, SaveButton } from './_form-helpers';

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

export function VatTab() {
  const [vatTypes, setVatTypes] = useState<VatType[]>([]);
  const [ticketBaiEnabled, setTicketBaiEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVat, setEditingVat] = useState<VatType | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formPercentage, setFormPercentage] = useState('');
  const [error, setError] = useState('');
  const [associationId, setAssociationId] = useState('');
  const [tbaiTerritory, setTbaiTerritory] = useState<string>('');
  const [tbaiSeries, setTbaiSeries] = useState('TB');
  const [tbaiSaved, setTbaiSaved] = useState(false);
  const [tbaiError, setTbaiError] = useState('');
  const [tbaiTesting, setTbaiTesting] = useState(false);
  const [tbaiTestResult, setTbaiTestResult] = useState<{ ok: boolean; error?: string } | null>(
    null
  );

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const session = await sessionRes.json();
        const assocId: string = session?.user?.associationId ?? '';
        setAssociationId(assocId);

        const [vatRes, assocRes] = await Promise.all([
          fetch('/api/vat-types'),
          assocId ? fetch(`/api/associations/${assocId}`) : Promise.resolve(null),
        ]);

        if (vatRes.ok) {
          const data = await vatRes.json();
          setVatTypes(data);
        }

        if (assocRes?.ok) {
          const assoc = await assocRes.json();
          setTicketBaiEnabled(assoc.ticketBaiEnabled ?? false);
        }

        if (assocId) {
          const tbaiRes = await fetch(`/api/associations/${assocId}/ticketbai`);
          if (tbaiRes.ok) {
            const tbai = await tbaiRes.json();
            if (tbai.series) setTbaiSeries(tbai.series);
            if (tbai.territory) setTbaiTerritory(tbai.territory);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  const handleSaveTbaiConfig = async () => {
    setTbaiError('');
    if (!tbaiTerritory) {
      setTbaiError('Lurraldearen hautaketa derrigorrezkoa da');
      return;
    }
    try {
      const resp = await fetch(`/api/associations/${associationId}/ticketbai`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          series: tbaiSeries.trim() || 'TB',
          territory: tbaiTerritory,
          providerType: 'MOCK',
        }),
      });
      if (!resp.ok) throw new Error(`Errorea (${resp.status})`);
      setTbaiSaved(true);
      setTimeout(() => setTbaiSaved(false), 2000);
    } catch (err) {
      setTbaiError(String(err));
    }
  };

  const handleTestTbai = async () => {
    setTbaiTesting(true);
    setTbaiTestResult(null);
    try {
      const resp = await fetch(`/api/associations/${associationId}/ticketbai`, { method: 'POST' });
      const result: { ok: boolean; error?: string } = await resp.json();
      setTbaiTestResult(result);
    } catch {
      setTbaiTestResult({ ok: false, error: 'Konexio errorea' });
    } finally {
      setTbaiTesting(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToggleRow
        label="TicketBAI gaitu"
        hint="Fakturazioa zerga agintaritzari bidaltzea"
        checked={ticketBaiEnabled}
        onChange={handleToggleTicketBai}
      />

      {ticketBaiEnabled && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: 20,
            background: 'var(--adm-surface)',
            border: '1px solid var(--adm-border)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--adm-text-sec)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            TicketBAI konfigurazioa
          </div>

          <div>
            <FormLabel>Lurraldea *</FormLabel>
            <FormHint>TicketBAI erabiltzen den zerga lurraldea</FormHint>
            <select
              value={tbaiTerritory}
              onChange={(e) => setTbaiTerritory(e.target.value)}
              style={{
                marginTop: 8,
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: tbaiTerritory ? '1px solid var(--adm-border)' : '1px solid #ef4444',
                background: 'var(--adm-surface)',
                color: tbaiTerritory ? 'var(--adm-text-pri)' : 'var(--adm-text-sec)',
                fontSize: 14,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="">— Hautatu lurraldea —</option>
              <option value="ARABA">TicketBAI Araba</option>
              <option value="BIZKAIA">TicketBAI Bizkaia</option>
              <option value="GIPUZKOA">TicketBAI Gipuzkoa</option>
              <option value="VERIFACTU">Verifactu</option>
            </select>
          </div>

          <div>
            <FormLabel>Faktura seriea</FormLabel>
            <FormHint>Faktura zenbakien aurrizki gisa erabiliko da (adib. &quot;TB&quot;)</FormHint>
            <input
              type="text"
              value={tbaiSeries}
              onChange={(e) => setTbaiSeries(e.target.value)}
              maxLength={10}
              style={{
                marginTop: 8,
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

          {tbaiTerritory && (
            <div>
              <FormLabel>Hornitzaile mota</FormLabel>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--adm-border)',
                  background: 'var(--adm-surface)',
                  color: 'var(--adm-text-sec)',
                  fontSize: 14,
                }}
              >
                Mock (Proba modua) — hornitzaile gehiago laster
              </div>
            </div>
          )}

          {tbaiError && <div style={{ fontSize: 12, color: '#ef4444' }}>{tbaiError}</div>}

          {tbaiTestResult && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: tbaiTestResult.ok ? '#22c55e' : '#ef4444',
              }}
            >
              {tbaiTestResult.ok
                ? '✓ Hornitzailea ondo dago'
                : `✗ ${tbaiTestResult.error ?? 'Errorea'}`}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleTestTbai}
              disabled={tbaiTesting}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                border: '1px solid var(--adm-border)',
                background: 'var(--adm-surface-hi)',
                color: 'var(--adm-text-sec)',
                cursor: tbaiTesting ? 'not-allowed' : 'pointer',
              }}
            >
              {tbaiTesting ? '⏳ Probatzen...' : 'Konexioa probatu'}
            </button>
            <SaveButton saved={tbaiSaved} onClick={handleSaveTbaiConfig} />
          </div>

          <a
            href="ticketbai"
            style={{
              fontSize: 13,
              color: 'var(--adm-primary, #e85d2f)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            → Faktura liburua ikusi
          </a>
        </div>
      )}

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
