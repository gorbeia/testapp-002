'use client';

interface Props {
  code: string;
}

export function VerificationCodeLabel({ code }: Props) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'var(--cust-text-sec, #bbb)',
        textAlign: 'center',
        marginTop: 16,
      }}
    >
      Kodea: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{code}</span>
    </div>
  );
}
