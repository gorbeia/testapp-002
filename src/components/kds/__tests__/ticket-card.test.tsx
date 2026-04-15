import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TicketCard } from '@/components/kds/ticket-card';
import type { Ticket } from '@/components/kds/types';

function makeTicket(overrides?: Partial<Ticket>): Ticket {
  return {
    id: 't1',
    orderNumber: 42,
    customerName: 'Josu',
    status: 'RECEIVED',
    elapsedMin: 0,
    isSlowOrder: false,
    hasAlert: false,
    lines: [
      { name: 'Burgerra', qty: 2, detail: null },
      { name: 'Entsalada', qty: 1, detail: 'alkate-saltsa barik' },
    ],
    notes: null,
    ...overrides,
  };
}

describe('TicketCard — basic rendering', () => {
  it('renders order number', () => {
    render(
      <TicketCard
        ticket={makeTicket()}
        isNext={false}
        onAdvance={vi.fn()}
        onShowInstructions={vi.fn()}
      />
    );
    expect(screen.getByText('#42')).toBeInTheDocument();
  });

  it('renders customer name', () => {
    render(
      <TicketCard
        ticket={makeTicket()}
        isNext={false}
        onAdvance={vi.fn()}
        onShowInstructions={vi.fn()}
      />
    );
    expect(screen.getByText('Josu')).toBeInTheDocument();
  });

  it('renders all ticket lines with qty and name', () => {
    render(
      <TicketCard
        ticket={makeTicket()}
        isNext={false}
        onAdvance={vi.fn()}
        onShowInstructions={vi.fn()}
      />
    );
    expect(screen.getByText('2×')).toBeInTheDocument();
    expect(screen.getByText('Burgerra')).toBeInTheDocument();
    expect(screen.getByText('1×')).toBeInTheDocument();
    expect(screen.getByText('Entsalada')).toBeInTheDocument();
  });

  it('renders variant detail when detail does not start with Kendu:', () => {
    const ticket = makeTicket({
      lines: [{ name: 'Burgerra', qty: 1, detail: 'ondo eginda' }],
    });
    render(
      <TicketCard ticket={ticket} isNext={false} onAdvance={vi.fn()} onShowInstructions={vi.fn()} />
    );
    expect(screen.getByText('— ondo eginda')).toBeInTheDocument();
  });
});

describe('TicketCard — removal badges', () => {
  it('renders red removal badges for Kendu: prefixed details', () => {
    const ticket = makeTicket({
      lines: [{ name: 'Burgerra', qty: 1, detail: 'Kendu: Tipula, Letxuga' }],
    });
    render(
      <TicketCard ticket={ticket} isNext={false} onAdvance={vi.fn()} onShowInstructions={vi.fn()} />
    );
    expect(screen.getByText('✕ Tipula')).toBeInTheDocument();
    expect(screen.getByText('✕ Letxuga')).toBeInTheDocument();
  });

  it('does not show removal badge when detail is null', () => {
    render(
      <TicketCard
        ticket={makeTicket()}
        isNext={false}
        onAdvance={vi.fn()}
        onShowInstructions={vi.fn()}
      />
    );
    expect(screen.queryByText(/✕/)).not.toBeInTheDocument();
  });
});

describe('TicketCard — notes', () => {
  it('shows notes when present', () => {
    const ticket = makeTicket({ notes: 'Burgerra ondo eginda' });
    render(
      <TicketCard ticket={ticket} isNext={false} onAdvance={vi.fn()} onShowInstructions={vi.fn()} />
    );
    expect(screen.getByText('Burgerra ondo eginda')).toBeInTheDocument();
  });

  it('does not show notes section when notes is null', () => {
    render(
      <TicketCard
        ticket={makeTicket({ notes: null })}
        isNext={false}
        onAdvance={vi.fn()}
        onShowInstructions={vi.fn()}
      />
    );
    expect(screen.queryByText('📝')).not.toBeInTheDocument();
  });
});

describe('TicketCard — isNext banner', () => {
  it('shows next order banner when isNext=true and status=RECEIVED', () => {
    render(
      <TicketCard
        ticket={makeTicket()}
        isNext={true}
        onAdvance={vi.fn()}
        onShowInstructions={vi.fn()}
      />
    );
    expect(screen.getByText(/Hurrengoa/i)).toBeInTheDocument();
  });

  it('does not show banner when isNext=false', () => {
    render(
      <TicketCard
        ticket={makeTicket()}
        isNext={false}
        onAdvance={vi.fn()}
        onShowInstructions={vi.fn()}
      />
    );
    expect(screen.queryByText(/Hurrengoa/i)).not.toBeInTheDocument();
  });
});

describe('TicketCard — action buttons', () => {
  it("advance button label is '→ Hasi' for RECEIVED tickets", () => {
    render(
      <TicketCard
        ticket={makeTicket({ status: 'RECEIVED' })}
        isNext={false}
        onAdvance={vi.fn()}
        onShowInstructions={vi.fn()}
      />
    );
    expect(screen.getByText('→ Hasi')).toBeInTheDocument();
  });

  it("advance button label is '→ Prest' for IN_PREPARATION tickets", () => {
    render(
      <TicketCard
        ticket={makeTicket({ status: 'IN_PREPARATION' })}
        isNext={false}
        onAdvance={vi.fn()}
        onShowInstructions={vi.fn()}
      />
    );
    expect(screen.getByText('→ Prest')).toBeInTheDocument();
  });

  it('calls onAdvance with ticket id when advance button clicked', async () => {
    const onAdvance = vi.fn();
    render(
      <TicketCard
        ticket={makeTicket()}
        isNext={false}
        onAdvance={onAdvance}
        onShowInstructions={vi.fn()}
      />
    );
    await userEvent.click(screen.getByText('→ Hasi'));
    expect(onAdvance).toHaveBeenCalledWith('t1');
  });

  it('calls onShowInstructions when 📖 button clicked', async () => {
    const onShowInstructions = vi.fn();
    render(
      <TicketCard
        ticket={makeTicket()}
        isNext={false}
        onAdvance={vi.fn()}
        onShowInstructions={onShowInstructions}
      />
    );
    await userEvent.click(screen.getByText('📖'));
    expect(onShowInstructions).toHaveBeenCalledOnce();
  });
});
