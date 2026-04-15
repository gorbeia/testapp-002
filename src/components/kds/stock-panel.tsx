import { KdsProduct } from "./types";

interface StockPanelProps {
  products: KdsProduct[];
  onToggle: (index: number) => void;
  onClose: () => void;
}

export function StockPanel({ products, onToggle, onClose }: StockPanelProps) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }} onClick={onClose}>
      <div style={{ background: "var(--ops-surface)", border: "1px solid var(--ops-border-hi)", borderRadius: "20px 20px 0 0", padding: "24px 24px 40px", width: "100%", maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <span style={{ color: "var(--ops-text-sec)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>Stocka kudeatu</span>
          <button onClick={onClose} style={{ background: "var(--ops-surface-hi)", border: "1px solid var(--ops-border)", color: "var(--ops-text-sec)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>Itxi</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {products.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--ops-surface-hi)", borderRadius: 10, padding: "12px 16px", border: `1px solid ${p.soldOut ? "var(--ops-red)" : "var(--ops-border)"}` }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: p.soldOut ? "var(--ops-red)" : "var(--ops-text-pri)", textDecoration: p.soldOut ? "line-through" : "none" }}>{p.name}</span>
              <button
                onClick={() => onToggle(i)}
                style={{ background: p.soldOut ? "var(--ops-red)" : "var(--ops-green)", border: "none", borderRadius: 8, padding: "7px 16px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 36 }}
              >
                {p.soldOut ? "Agortuta" : "Erabilgarri"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
