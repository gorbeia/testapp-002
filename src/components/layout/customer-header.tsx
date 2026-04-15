import { ReactNode } from 'react';

interface CustomerHeaderProps {
  txosnaName: string;
  status?: 'OPEN' | 'PAUSED' | 'CLOSED';
  waitMinutes?: number | null;
  right?: ReactNode;
}

const STATUS_COLORS = {
  OPEN: { dot: '#22c55e', label: 'Irekita' },
  PAUSED: { dot: '#f59e0b', label: 'Geldituta' },
  CLOSED: { dot: '#6b6460', label: 'Itxita' },
};

export function CustomerHeader({
  txosnaName,
  status = 'OPEN',
  waitMinutes,
  right,
}: CustomerHeaderProps) {
  const sc = STATUS_COLORS[status];

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: 'var(--cust-surface)',
        borderColor: 'var(--cust-border)',
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 h-14">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: sc.dot }} />
          <span
            className="font-bold text-base truncate"
            style={{
              fontFamily: 'var(--font-nunito), sans-serif',
              color: 'var(--cust-text-pri)',
            }}
          >
            {txosnaName}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{
              background:
                status === 'OPEN'
                  ? 'rgba(34,197,94,0.15)'
                  : status === 'PAUSED'
                    ? 'rgba(245,158,11,0.15)'
                    : 'var(--cust-surface-hi)',
              color:
                status === 'OPEN'
                  ? '#22c55e'
                  : status === 'PAUSED'
                    ? '#f59e0b'
                    : 'var(--cust-text-sec)',
            }}
          >
            {sc.label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {waitMinutes && (
            <div
              className="text-xs flex items-center gap-1 px-2 py-1 rounded-full"
              style={{
                background: 'var(--cust-bg)',
                color: 'var(--cust-text-sec)',
                border: '1px solid var(--cust-border)',
              }}
            >
              <span>⏱</span>
              <span>~{waitMinutes} min</span>
            </div>
          )}
          {right}
        </div>
      </div>
    </header>
  );
}
