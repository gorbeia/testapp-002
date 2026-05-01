'use client';

export interface TicketSummary {
  id: string;
  counterType: string;
  status: string;
}

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Jasota',
  IN_PREPARATION: 'Prestatzen',
  READY: 'Prest! 🎉',
  COMPLETED: 'Amaituta ✓',
  CANCELLED: 'Bertan behera',
};

const STATUS_COLOR: Record<string, string> = {
  RECEIVED: '#888',
  IN_PREPARATION: 'var(--cust-primary, #e85d2f)',
  READY: '#22c55e',
  COMPLETED: '#22c55e',
  CANCELLED: '#c0392b',
};

const COUNTER_LABEL: Record<string, string> = {
  FOOD: 'Janaria',
  DRINKS: 'Edariak',
};

interface Props {
  tickets: TicketSummary[];
  pendingPayment?: boolean;
}

export function TicketStatusCards({ tickets, pendingPayment }: Props) {
  if (tickets.length === 0) {
    return (
      <div
        style={{
          background: 'var(--cust-surface, #fff)',
          borderRadius: 12,
          padding: '20px 16px',
          fontSize: 14,
          color: 'var(--cust-text-sec, #666)',
          textAlign: 'center',
          marginBottom: 28,
        }}
      >
        {pendingPayment ? 'Ordaintze zain...' : 'Txartelik ez'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
      {tickets.map((t) => (
        <div
          key={t.id}
          style={{
            background: 'var(--cust-surface, #fff)',
            borderRadius: 12,
            padding: '16px 18px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
            borderLeft: `4px solid ${STATUS_COLOR[t.status] ?? '#ccc'}`,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--cust-text-sec, #999)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            {COUNTER_LABEL[t.counterType] ?? t.counterType}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: STATUS_COLOR[t.status] ?? 'var(--cust-text-pri, #333)',
            }}
          >
            {STATUS_LABEL[t.status] ?? t.status}
          </div>
        </div>
      ))}
    </div>
  );
}
