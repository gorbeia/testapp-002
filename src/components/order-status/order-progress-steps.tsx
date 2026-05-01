'use client';

type StepKey = 'CONFIRMED' | 'IN_PREPARATION' | 'READY';

const STEPS: { key: StepKey; label: string; icon: string }[] = [
  { key: 'CONFIRMED', label: 'Jasota', icon: '✓' },
  { key: 'IN_PREPARATION', label: 'Prestatzen', icon: '👨‍🍳' },
  { key: 'READY', label: 'Prest!', icon: '🎉' },
];

interface Props {
  /** Index of the current step (0 = CONFIRMED, 1 = IN_PREPARATION, 2 = READY). -1 = none active. */
  currentStep: number;
  isReady?: boolean;
}

export function OrderProgressSteps({ currentStep, isReady }: Props) {
  return (
    <div
      style={{
        background: 'var(--cust-surface, #fff)',
        borderRadius: 16,
        border: '1px solid var(--cust-border, #e5e7eb)',
        padding: '20px 20px 24px',
        marginBottom: 20,
      }}
    >
      {STEPS.map((step, i) => {
        const done = i <= currentStep;
        const active = i === currentStep;
        return (
          <div
            key={step.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: i < STEPS.length - 1 ? 20 : 0,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background:
                  done || isReady ? 'var(--cust-primary, #e85d2f)' : 'var(--cust-bg, #faf8f5)',
                border: `2px solid ${done || isReady ? 'var(--cust-primary, #e85d2f)' : 'var(--cust-border, #e5e7eb)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              <span style={{ color: done || isReady ? '#fff' : 'var(--cust-text-dim, #d1d5db)' }}>
                {done ? '✓' : step.icon}
              </span>
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: active ? 700 : 500,
                color:
                  done || isReady ? 'var(--cust-text-pri, #111)' : 'var(--cust-text-dim, #d1d5db)',
              }}
            >
              {step.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
