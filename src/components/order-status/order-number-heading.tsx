'use client';

interface Props {
  orderNumber: number;
  isCancelled?: boolean;
  isReady?: boolean;
  isPending?: boolean;
  customerName?: string | null;
}

export function OrderNumberHeading({
  orderNumber,
  isCancelled,
  isReady,
  isPending,
  customerName,
}: Props) {
  const color = isCancelled
    ? '#ef4444'
    : isReady
      ? 'var(--cust-accent, #2d5a3d)'
      : 'var(--cust-primary, #e85d2f)';

  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      <div style={{ fontSize: 13, color: 'var(--cust-text-sec, #6b7280)', marginBottom: 4 }}>
        Zure eskaera zenbakia
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 56,
          fontWeight: 800,
          color,
          lineHeight: 1,
        }}
      >
        #{orderNumber}
      </div>
      {customerName && (
        <div style={{ fontSize: 14, color: 'var(--cust-text-sec, #666)', marginTop: 6 }}>
          {customerName}
        </div>
      )}
      {isPending && !isCancelled && (
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--cust-primary, #e85d2f)',
            marginTop: 8,
          }}
        >
          Zain... 📞
        </div>
      )}
      {isCancelled && (
        <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', marginTop: 8 }}>
          Eskaera ezeztatua ❌
        </div>
      )}
      {isReady && (
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--cust-accent, #2d5a3d)',
            marginTop: 8,
          }}
        >
          Zure eskaera prest dago! 🎉
        </div>
      )}
    </div>
  );
}
