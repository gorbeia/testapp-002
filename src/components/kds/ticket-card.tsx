import { Ticket } from './types';

interface TicketCardProps {
  ticket: Ticket;
  isNext: boolean;
  onAdvance: (id: string) => void;
  onShowInstructions: () => void;
}

const STATUS_BORDER: Record<string, string> = {
  RECEIVED: 'var(--ops-blue, #3b82f6)',
  IN_PREPARATION: 'var(--ops-amber, #f59e0b)',
  READY: 'var(--ops-green)',
};

export function TicketCard({ ticket, isNext, onAdvance, onShowInstructions }: TicketCardProps) {
  const borderColor =
    ticket.status === 'IN_PREPARATION' && ticket.isSlowOrder
      ? 'var(--ops-amber, #f59e0b)'
      : (STATUS_BORDER[ticket.status] ?? 'var(--ops-border)');

  const nextLabel = { RECEIVED: '→ Hasi', IN_PREPARATION: '→ Prest', READY: '→ Amaituta' }[
    ticket.status
  ];
  const nextBg = ticket.status === 'READY' ? 'var(--ops-green)' : 'var(--ops-orange)';
  const nextColor = ticket.status === 'READY' ? '#0a0a0a' : '#fff';

  const statusColors: Record<string, { bg: string; text: string }> = {
    RECEIVED: { bg: 'var(--ops-blue, #3b82f6)', text: '#fff' },
    IN_PREPARATION: { bg: 'var(--ops-amber, #f59e0b)', text: '#000' },
    READY: { bg: 'var(--ops-green)', text: '#000' },
  };
  const sc = statusColors[ticket.status] ?? {
    bg: 'var(--ops-border)',
    text: 'var(--ops-text-pri)',
  };

  const hasTopBanner = (isNext && ticket.status === 'RECEIVED') || ticket.hasAlert;

  return (
    <div
      style={{
        background: 'var(--ops-surface)',
        border: `2px solid ${borderColor}`,
        borderRadius: 14,
        padding: '14px 14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
    >
      {isNext && ticket.status === 'RECEIVED' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'var(--ops-orange)',
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          ⬆ Hurrengoa
        </div>
      )}
      {ticket.hasAlert && !isNext && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background: 'var(--ops-orange-dim)',
            borderBottom: '1px solid var(--ops-orange)',
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--ops-orange)',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          🔔 Eskaera aldatua
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: hasTopBanner ? 20 : 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              fontFamily: 'var(--font-nunito, sans-serif)',
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--ops-text-pri)',
              letterSpacing: '-0.02em',
            }}
          >
            #{ticket.orderNumber}
          </span>
          {ticket.customerName && (
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ops-text-sec)' }}>
              {ticket.customerName}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {ticket.isSlowOrder && (
            <span style={{ color: 'var(--ops-amber, #f59e0b)', fontSize: 12, fontWeight: 600 }}>
              ⏱ {ticket.elapsedMin}min
            </span>
          )}
          <span
            style={{
              background: sc.bg,
              color: sc.text,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.07em',
              padding: '3px 9px',
              borderRadius: 99,
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {{ RECEIVED: 'Jasota', IN_PREPARATION: 'Prestatzen', READY: 'Prest' }[ticket.status] ??
              ticket.status}
          </span>
        </div>
      </div>

      <div
        style={{
          background: 'var(--ops-surface-hi)',
          borderRadius: 8,
          padding: '9px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {ticket.lines.map((line, i) => {
          const removals = line.detail?.startsWith('Kendu:') ? line.detail.slice(6).trim() : null;
          const variant = line.detail && !line.detail.startsWith('Kendu:') ? line.detail : null;
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--ops-orange)',
                    minWidth: 22,
                  }}
                >
                  {line.qty}×
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ops-text-pri)' }}>
                  {line.name}
                </span>
                {variant && (
                  <span style={{ fontSize: 12, color: 'var(--ops-text-sec)' }}>— {variant}</span>
                )}
              </div>
              {removals && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingLeft: 30 }}>
                  {removals
                    .split(',')
                    .map((r) => r.trim())
                    .filter(Boolean)
                    .map((r) => (
                      <span
                        key={r}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#ef4444',
                          background: 'rgba(239,68,68,0.12)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 6,
                          padding: '2px 7px',
                        }}
                      >
                        ✕ {r}
                      </span>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {ticket.notes && (
        <div
          style={{
            background: 'var(--ops-amber-dim, #78350f)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            color: 'var(--ops-amber, #f59e0b)',
            display: 'flex',
            gap: 6,
            alignItems: 'flex-start',
          }}
        >
          <span>📝</span>
          <span>{ticket.notes}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onShowInstructions}
          style={{
            background: 'var(--ops-surface-hi)',
            border: '1px solid var(--ops-border)',
            borderRadius: 8,
            padding: '9px 12px',
            color: 'var(--ops-text-sec)',
            fontSize: 14,
            cursor: 'pointer',
            minWidth: 44,
            minHeight: 44,
          }}
        >
          📖
        </button>
        <button
          onClick={() => onAdvance(ticket.id)}
          style={{
            flex: 1,
            background: nextBg,
            border: 'none',
            borderRadius: 8,
            padding: '10px 16px',
            color: nextColor,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 44,
            letterSpacing: '0.02em',
          }}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
