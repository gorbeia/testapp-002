export interface TicketLine {
  name: string;
  qty: number;
  detail: string | null;
}

export interface Ticket {
  id: string;
  orderNumber: number;
  customerName: string | null;
  status: 'RECEIVED' | 'IN_PREPARATION' | 'READY';
  elapsedMin: number;
  isSlowOrder: boolean;
  hasAlert: boolean;
  lines: TicketLine[];
  notes: string | null;
}

export interface KdsComplement {
  name: string;
  soldOut: boolean;
}

export interface KdsProduct {
  name: string;
  soldOut: boolean;
  /** Optional sides / variant options that can run out independently */
  complements?: KdsComplement[];
}
