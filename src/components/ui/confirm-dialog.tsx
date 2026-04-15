interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmDanger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 300,
        padding: '0 16px',
      }}
    >
      <div
        style={{
          background: 'var(--ops-surface)',
          border: '1px solid var(--ops-border-hi)',
          borderRadius: 16,
          padding: '24px 24px 20px',
          width: '100%',
          maxWidth: 400,
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-nunito, sans-serif)',
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--ops-text-pri)',
            marginBottom: 10,
          }}
        >
          {title}
        </h2>
        <p
          style={{ fontSize: 14, color: 'var(--ops-text-sec)', lineHeight: 1.6, marginBottom: 24 }}
        >
          {message}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onConfirm}
            style={{
              background: confirmDanger ? 'var(--ops-red)' : 'var(--ops-orange)',
              border: 'none',
              borderRadius: 10,
              padding: '12px 16px',
              color: '#fff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              minHeight: 48,
            }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            style={{
              background: 'var(--ops-surface-hi)',
              border: '1px solid var(--ops-border)',
              borderRadius: 10,
              padding: '12px 16px',
              color: 'var(--ops-text-sec)',
              fontSize: 14,
              cursor: 'pointer',
              minHeight: 48,
            }}
          >
            Utzi
          </button>
        </div>
      </div>
    </div>
  );
}
