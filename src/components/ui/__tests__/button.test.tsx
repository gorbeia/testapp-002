import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Klikatu</Button>);
    expect(screen.getByText("Klikatu")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Klikatu</Button>);
    await userEvent.click(screen.getByText("Klikatu"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Klikatu</Button>);
    await userEvent.click(screen.getByText("Klikatu"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies default variant class", () => {
    const { container } = render(<Button>Default</Button>);
    expect(container.firstChild).toHaveClass("bg-primary");
  });

  it("applies destructive variant class", () => {
    const { container } = render(<Button variant="destructive">Ezabatu</Button>);
    expect(container.firstChild).toHaveClass("bg-destructive/10");
  });
});
