"use client";
import { useState } from "react";
import { Ticket } from "./types";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

// Fallback instructions for products not yet in mock data
const FALLBACK_INSTRUCTIONS: Record<string, string> = {
  "Entsalada": "## Entsalada\n\n1. Ebaki letxuga, tomatea eta pepinoa\n2. Gehitu alkate-saltsa\n3. Eskatu lehenengo zerbitzu aurretik",
  "Pintxo nahasia": "## Pintxo nahasia\n\n1. Aukeratu 6 pintxo anolak\n2. Sartu oholtzan\n3. Berotu labean 3 minutuz",
  "Txorizoa ogian": "## Txorizoa ogian\n\n1. Ebaki ogitartekoa\n2. Jarri txorizoa planxan 2 minutuz\n3. Muntatu",
  "Tortilla": "## Tortilla\n\n1. Arrautzak eta patatak nahastu\n2. Planxan 4 minutuz\n3. Buelta eman",
  "Ogia gurinarekin": "## Ogia gurinarekin\n\n1. Moztu ogia\n2. Jarri gurina\n3. Erre planxan",
};

function getInstructions(productName: string): string | null {
  const product = MOCK_PRODUCTS.find(p => p.name === productName);
  if (product?.preparationInstructions) return product.preparationInstructions;
  return FALLBACK_INSTRUCTIONS[productName] ?? null;
}

function renderInstructions(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("## "))  return <h2 key={i} style={{ color: "var(--ops-orange)", fontSize: 18, margin: "0 0 12px", fontFamily: "var(--font-nunito, sans-serif)" }}>{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} style={{ color: "var(--ops-text-pri)", fontSize: 14, margin: "16px 0 6px", fontWeight: 700 }}>{line.slice(4)}</h3>;
    if (/^\d+\./.test(line))     return <p  key={i} style={{ color: "var(--ops-text-pri)", margin: "0 0 6px", fontSize: 14, paddingLeft: 8 }}>{line}</p>;
    if (line.startsWith("- "))   return <p  key={i} style={{ color: "var(--ops-text-sec)", margin: "0 0 4px", fontSize: 13, paddingLeft: 12 }}>• {line.slice(2)}</p>;
    if (line.startsWith("> "))   return <p  key={i} style={{ color: "var(--ops-amber, #f59e0b)", margin: "12px 0", fontSize: 13, paddingLeft: 12, borderLeft: "3px solid var(--ops-amber, #f59e0b)" }}>{line.slice(2)}</p>;
    if (line === "") return <div key={i} style={{ height: 8 }} />;
    return <p key={i} style={{ color: "var(--ops-text-sec)", margin: "0 0 6px", fontSize: 13 }}>{line}</p>;
  });
}

interface InstructionsOverlayProps {
  ticket: Ticket;
  onClose: () => void;
}

export function InstructionsOverlay({ ticket, onClose }: InstructionsOverlayProps) {
  const productsWithInstructions = ticket.lines
    .map(l => ({ name: l.name, instructions: getInstructions(l.name) }))
    .filter(p => p.instructions !== null);

  const [activeIdx, setActiveIdx] = useState(0);

  if (productsWithInstructions.length === 0) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }} onClick={onClose}>
        <div style={{ background: "var(--ops-surface)", border: "1px solid var(--ops-border-hi)", borderRadius: "20px 20px 0 0", padding: "32px 24px 48px", width: "100%", maxWidth: 560, textAlign: "center" }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📖</div>
          <div style={{ color: "var(--ops-text-sec)", fontSize: 15 }}>Eskaera honentzat ez dago prestaketa argibiderik.</div>
          <button onClick={onClose} style={{ marginTop: 20, background: "var(--ops-surface-hi)", border: "1px solid var(--ops-border)", color: "var(--ops-text-sec)", borderRadius: 8, padding: "10px 24px", cursor: "pointer", fontSize: 14 }}>Itxi</button>
        </div>
      </div>
    );
  }

  const active = productsWithInstructions[activeIdx];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }} onClick={onClose}>
      <div style={{ background: "var(--ops-surface)", border: "1px solid var(--ops-border-hi)", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 560, maxHeight: "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "18px 20px 0", borderBottom: "1px solid var(--ops-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ color: "var(--ops-text-sec)", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Prestaketa argibideak — #{ticket.orderNumber}
            </span>
            <button onClick={onClose} style={{ background: "var(--ops-surface-hi)", border: "1px solid var(--ops-border)", color: "var(--ops-text-sec)", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 13 }}>Itxi</button>
          </div>

          {/* Product tabs — only shown when multiple products have instructions */}
          {productsWithInstructions.length > 1 && (
            <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
              {productsWithInstructions.map((p, i) => (
                <button key={p.name} onClick={() => setActiveIdx(i)} style={{
                  padding: "8px 16px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
                  borderBottom: `2px solid ${activeIdx === i ? "var(--ops-orange)" : "transparent"}`,
                  background: "transparent",
                  color: activeIdx === i ? "var(--ops-orange)" : "var(--ops-text-sec)",
                  whiteSpace: "nowrap",
                }}>
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 40px" }}>
          {renderInstructions(active.instructions!)}
        </div>
      </div>
    </div>
  );
}
