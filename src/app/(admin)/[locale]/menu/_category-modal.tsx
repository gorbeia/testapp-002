'use client';
import { useState } from 'react';
import { inputStyle, sectionLabel } from './_form-helpers';
import type { CategoryModalState } from './_types';

export function CategoryModal({
  state,
  onSave,
  onClose,
}: {
  state: CategoryModalState;
  onSave: (name: string, type: 'FOOD' | 'DRINK') => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(state.name);
  const [type, setType] = useState<'FOOD' | 'DRINK'>(state.type);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--adm-surface)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px' }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--adm-text-pri)',
              margin: '0 0 20px',
            }}
          >
            {state.editId ? 'Kategoria editatu' : 'Kategoria berria'}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={sectionLabel}>Izena *</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adib.: Janaria"
                style={inputStyle}
                autoFocus
              />
            </div>
            <div>
              <div style={sectionLabel}>Mota</div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'FOOD' | 'DRINK')}
                style={{ ...inputStyle, background: 'var(--adm-surface)' }}
              >
                <option value="FOOD">🍔 Janaria</option>
                <option value="DRINK">🍺 Edaria</option>
              </select>
            </div>
          </div>
        </div>
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--adm-border)',
            display: 'flex',
            gap: 10,
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--adm-surface-hi)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 14,
              cursor: 'pointer',
              color: 'var(--adm-text-pri)',
            }}
          >
            Utzi
          </button>
          <button
            type="button"
            onClick={() => name.trim() && onSave(name.trim(), type)}
            disabled={!name.trim()}
            style={{
              background: name.trim() ? '#e85d2f' : 'var(--adm-surface-hi)',
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: name.trim() ? '#fff' : 'var(--adm-text-sec)',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            {state.editId ? 'Gorde' : 'Sortu'}
          </button>
        </div>
      </div>
    </div>
  );
}
