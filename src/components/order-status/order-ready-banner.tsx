'use client';

export function OrderReadyBanner() {
  return (
    <div
      style={{
        background: 'var(--cust-accent, #22c55e)',
        color: '#fff',
        borderRadius: 12,
        padding: '18px 20px',
        textAlign: 'center',
        fontWeight: 700,
        fontSize: 17,
        marginBottom: 20,
      }}
    >
      Zure eskaera prest dago! Jaso dezakezu.
    </div>
  );
}
