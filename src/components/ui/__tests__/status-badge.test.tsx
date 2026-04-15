import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge — ticket type", () => {
  it("renders RECEIVED label", () => {
    render(<StatusBadge status="RECEIVED" type="ticket" />);
    expect(screen.getByText("Jasota")).toBeInTheDocument();
  });

  it("renders IN_PREPARATION label", () => {
    render(<StatusBadge status="IN_PREPARATION" type="ticket" />);
    expect(screen.getByText("Prestatzen")).toBeInTheDocument();
  });

  it("renders READY label", () => {
    render(<StatusBadge status="READY" type="ticket" />);
    expect(screen.getByText("Prest")).toBeInTheDocument();
  });

  it("renders CANCELLED label", () => {
    render(<StatusBadge status="CANCELLED" type="ticket" />);
    expect(screen.getByText("Ezeztatuta")).toBeInTheDocument();
  });
});

describe("StatusBadge — order type", () => {
  it("renders PENDING_PAYMENT label", () => {
    render(<StatusBadge status="PENDING_PAYMENT" type="order" />);
    expect(screen.getByText("Ordaintze zain")).toBeInTheDocument();
  });

  it("renders CONFIRMED label", () => {
    render(<StatusBadge status="CONFIRMED" type="order" />);
    expect(screen.getByText("Baieztatuta")).toBeInTheDocument();
  });

  it("renders CANCELLED label for order", () => {
    render(<StatusBadge status="CANCELLED" type="order" />);
    expect(screen.getByText("Ezeztatuta")).toBeInTheDocument();
  });
});

describe("StatusBadge — txosna type", () => {
  it("renders OPEN label", () => {
    render(<StatusBadge status="OPEN" type="txosna" />);
    expect(screen.getByText("Irekita")).toBeInTheDocument();
  });

  it("renders PAUSED label", () => {
    render(<StatusBadge status="PAUSED" type="txosna" />);
    expect(screen.getByText("Geldituta")).toBeInTheDocument();
  });

  it("renders CLOSED label", () => {
    render(<StatusBadge status="CLOSED" type="txosna" />);
    expect(screen.getByText("Itxita")).toBeInTheDocument();
  });
});

describe("StatusBadge — large prop", () => {
  it("applies larger text class when large=true", () => {
    const { container } = render(<StatusBadge status="OPEN" type="txosna" large />);
    expect(container.firstChild).toHaveClass("text-sm");
  });

  it("applies small text class when large=false (default)", () => {
    const { container } = render(<StatusBadge status="OPEN" type="txosna" />);
    expect(container.firstChild).toHaveClass("text-xs");
  });
});
