'use client';
import { useState } from 'react';

const sharedStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  width: '100%',
  background: 'var(--cust-surface, #fff)',
  border: '2px solid var(--cust-primary, #e85d2f)',
  borderRadius: 10,
  padding: '13px 20px',
  color: 'var(--cust-primary, #e85d2f)',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  marginBottom: 12,
  textDecoration: 'none',
  textAlign: 'center',
  boxSizing: 'border-box',
  transition: 'background 0.15s',
};

interface LinkProps {
  href: string;
}

interface ButtonProps {
  orderId: string;
}

type Props = LinkProps | ButtonProps;

function isLink(p: Props): p is LinkProps {
  return 'href' in p;
}

export function ReceiptDownload(props: Props) {
  const [downloading, setDownloading] = useState(false);

  if (isLink(props)) {
    return (
      <a href={props.href} target="_blank" rel="noopener noreferrer" style={sharedStyle}>
        ↓ Deskargatu txartela
      </a>
    );
  }

  const handleDownload = () => {
    setDownloading(true);
    const lines = [
      '================================',
      '  Txosna Eskaera Agiri',
      '================================',
      `Eskaera zenbakia: #${props.orderId}`,
      `Data: ${new Date().toLocaleString('eu-ES')}`,
      '--------------------------------',
      'GUZTIRA: 0.00€',
      '================================',
      'Eskerrik asko!',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `txosna-eskaera-${props.orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setDownloading(false), 1500);
  };

  return (
    <button onClick={handleDownload} disabled={downloading} style={sharedStyle}>
      {downloading ? '⏳ Deskargatzen...' : '⬇️ Ordainagiri digitala deskargatu'}
    </button>
  );
}
