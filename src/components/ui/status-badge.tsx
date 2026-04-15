import { cn } from "@/lib/utils";

type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "CANCELLED";
type TicketStatus =
  | "RECEIVED"
  | "IN_PREPARATION"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";
type TxosnaStatus = "OPEN" | "PAUSED" | "CLOSED";

const TICKET_LABELS: Record<TicketStatus, string> = {
  RECEIVED: "Jasota",
  IN_PREPARATION: "Prestatzen",
  READY: "Prest",
  COMPLETED: "Amaituta",
  CANCELLED: "Ezeztatuta",
};

const ORDER_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Ordaintze zain",
  CONFIRMED: "Baieztatuta",
  CANCELLED: "Ezeztatuta",
};

const TXOSNA_LABELS: Record<TxosnaStatus, string> = {
  OPEN: "Irekita",
  PAUSED: "Geldituta",
  CLOSED: "Itxita",
};

const TICKET_COLORS: Record<TicketStatus, string> = {
  RECEIVED: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  IN_PREPARATION: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  READY: "bg-green-500/20 text-green-300 border border-green-500/30",
  COMPLETED: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  CANCELLED: "bg-gray-500/20 text-gray-500 border border-gray-500/30",
};

const TXOSNA_COLORS: Record<TxosnaStatus, string> = {
  OPEN: "bg-green-500/20 text-green-400 border border-green-500/30",
  PAUSED: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  CLOSED: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

interface Props {
  status: TicketStatus | OrderStatus | TxosnaStatus;
  type?: "ticket" | "order" | "txosna";
  className?: string;
  large?: boolean;
}

export function StatusBadge({ status, type = "ticket", className, large }: Props) {
  let label: string;
  let colorClass: string;

  if (type === "txosna") {
    label = TXOSNA_LABELS[status as TxosnaStatus] ?? status;
    colorClass = TXOSNA_COLORS[status as TxosnaStatus] ?? "bg-gray-500/20 text-gray-400";
  } else if (type === "order") {
    label = ORDER_LABELS[status as OrderStatus] ?? status;
    colorClass = TICKET_COLORS[(status === "CONFIRMED" ? "RECEIVED" : status === "PENDING_PAYMENT" ? "IN_PREPARATION" : "CANCELLED") as TicketStatus];
  } else {
    label = TICKET_LABELS[status as TicketStatus] ?? status;
    colorClass = TICKET_COLORS[status as TicketStatus] ?? "bg-gray-500/20 text-gray-400";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold uppercase tracking-wider",
        large ? "px-4 py-1.5 text-sm" : "px-2.5 py-0.5 text-xs",
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}
