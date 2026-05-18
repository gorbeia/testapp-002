'use client';
import { useState, useEffect } from 'react';
import { inputStyle } from './_form-helpers';
import type { VatType } from './_types';

export function VatTypeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [vatTypes, setVatTypes] = useState<VatType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/vat-types')
      .then((r) => r.json())
      .then((data) => {
        setVatTypes(data);
        // Auto-select IVA Reducido (10%) on first load if no selection
        if (!value && data.length > 0) {
          const reduced = data.find((v: VatType) => parseFloat(v.percentage) === 10);
          if (reduced) onChange(reduced.id);
        }
      })
      .catch((err) => console.error('Failed to load VAT types:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, background: 'var(--adm-surface)' }}
      disabled={loading}
    >
      <option value="">Aukeratu BEZ</option>
      {vatTypes.map((vat) => (
        <option key={vat.id} value={vat.id}>
          {vat.label} ({vat.percentage}%)
        </option>
      ))}
    </select>
  );
}
