import Link from "next/link";
import { ReactNode } from "react";

interface OpsHeaderProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  statusColor?: "green" | "amber" | "red" | "dim";
}

const STATUS_DOT: Record<string, string> = {
  green: "bg-[var(--ops-green)] shadow-[0_0_7px_var(--ops-green)]",
  amber: "bg-[var(--ops-amber)]",
  red: "bg-[var(--ops-red)]",
  dim: "bg-[var(--ops-text-dim)]",
};

export function OpsHeader({
  title,
  subtitle,
  left,
  right,
  statusColor = "green",
}: OpsHeaderProps) {
  return (
    <header
      style={{
        background: "var(--ops-surface)",
        borderBottom: "1px solid var(--ops-border)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        height: 60,
      }}
      className="flex items-center justify-between gap-3 px-4"
    >
      <div className="flex items-center gap-3 min-w-0">
        {left}
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[statusColor]}`}
        />
        <div className="min-w-0">
          <div
            className="font-bold truncate text-base leading-tight"
            style={{
              fontFamily: "var(--font-nunito), sans-serif",
              color: "var(--ops-text-pri)",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div className="text-xs truncate" style={{ color: "var(--ops-text-sec)" }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {right && <div className="flex items-center gap-2 flex-shrink-0">{right}</div>}
    </header>
  );
}

export function OpsNavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
      style={{
        background: active ? "var(--ops-surface-hi)" : "transparent",
        color: active ? "var(--ops-text-pri)" : "var(--ops-text-sec)",
        border: `1px solid ${active ? "var(--ops-border-hi)" : "transparent"}`,
      }}
    >
      {children}
    </Link>
  );
}
