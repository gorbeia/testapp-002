'use client';
import { useState, useEffect } from 'react';
import { FormLabel, FormHint, SaveButton } from './_form-helpers';

export function GeneralTab() {
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
