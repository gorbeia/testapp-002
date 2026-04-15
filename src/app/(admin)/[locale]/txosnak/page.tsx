"use client";
import Link from "next/link";
import { useState } from "react";
import { MOCK_ASSOCIATION, MockTxosna } from "@/lib/mock-data";

const STATUS_LABEL: Record<string, string> = { OPEN: "Irekita", PAUSED: "Geldituta", CLOSED: "Itxita" };
const STATUS_COLOR: Record<string, string> = { OPEN: "#22c55e", PAUSED: "#f59e0b", CLOSED: "#6b7280" };

interface CloneDialogProps {
  txosna: MockTxosna;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newName: string) => void;
}

function CloneDialog({ txosna, isOpen, onClose, onConfirm }: CloneDialogProps) {
  const [newName, setNewName] = useState(`${txosna.name} (kopia)`);

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "0 16px" }}>
      <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 16, padding: "24px", width: "100%", maxWidth: 480 }}>
        <h2 style={{ fontFamily: "var(--font-nunito, sans-serif)", fontSize: 20, fontWeight: 800, color: "var(--adm-text-pri)", marginBottom: 8 }}>
          Txosna klonatu
        </h2>
        <p style={{ fontSize: 14, color: "var(--adm-text-sec)", lineHeight: 1.5, marginBottom: 20 }}>
          <strong>{txosna.name}</strong> txosnaren konfigurazioa kopiatuko da txosna berri batera.
        </p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--adm-text-pri)", marginBottom: 6 }}>
            Txosna berriaren izena
          </label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--adm-border)", fontSize: 14, background: "var(--adm-bg)", color: "var(--adm-text-pri)", outline: "none" }}
          />
        </div>

        <div style={{ background: "var(--adm-bg)", borderRadius: 10, padding: "14px 16px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--adm-text-pri)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Kopiatuko dena:
          </div>
          <ul style={{ fontSize: 13, color: "var(--adm-text-sec)", lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>Mostradore konfigurazioa (bakarra/banandua)</li>
            <li>Gaitutako eskaera kanalak</li>
            <li>Ordainketa metodoak eta hornitzaileak</li>
            <li>Jakinarazpen moduak</li>
            <li>QR baliozkotzea eta itxaron denbora</li>
            <li>Produktuen konfigurazioak (prezioak, eskuragarritasuna)</li>
          </ul>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={() => onConfirm(newName)}
            disabled={!newName.trim()}
            style={{ 
              background: "#e85d2f", 
              border: "none", 
              borderRadius: 10, 
              padding: "12px 16px", 
              color: "#fff", 
              fontSize: 14, 
              fontWeight: 700, 
              cursor: newName.trim() ? "pointer" : "not-allowed", 
              minHeight: 48,
              opacity: newName.trim() ? 1 : 0.5
            }}
          >
            Klonatu
          </button>
          <button
            onClick={onClose}
            style={{ background: "var(--adm-surface-hi)", border: "1px solid var(--adm-border)", borderRadius: 10, padding: "12px 16px", color: "var(--adm-text-sec)", fontSize: 14, cursor: "pointer", minHeight: 48 }}
          >
            Utzi
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TxosnakPage() {
  const [txosnak, setTxosnak] = useState(MOCK_ASSOCIATION.txosnak);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [selectedTxosna, setSelectedTxosna] = useState<MockTxosna | null>(null);

  const totalOrders  = txosnak.reduce((s, t) => s + (t.ordersToday ?? 0), 0);
  const totalRevenue = txosnak.reduce((s, t) => s + (t.revenueToday ?? 0), 0);
  const openCount    = txosnak.filter(t => t.status === "OPEN").length;

  const handleCloneClick = (txosna: MockTxosna) => {
    setSelectedTxosna(txosna);
    setCloneDialogOpen(true);
  };

  const handleCloneConfirm = (newName: string) => {
    if (!selectedTxosna) return;
    
    const newTxosna: MockTxosna = {
      ...selectedTxosna,
      id: `txosna-${Date.now()}`,
      name: newName,
      slug: `${selectedTxosna.slug}-kopia-${Date.now()}`,
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      status: "CLOSED",
      ordersToday: 0,
      revenueToday: 0,
    };
    
    setTxosnak([...txosnak, newTxosna]);
    setCloneDialogOpen(false);
    setSelectedTxosna(null);
  };

  return (
    <div style={{ padding: "32px 32px 60px", background: "var(--adm-bg)", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-nunito, sans-serif)", fontSize: 26, fontWeight: 800, color: "var(--adm-text-pri)", margin: "0 0 4px" }}>{MOCK_ASSOCIATION.name}</h1>
        <div style={{ fontSize: 14, color: "var(--adm-text-sec)" }}>{MOCK_ASSOCIATION.txosnak.length} txosna · {openCount} irekita</div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32, maxWidth: 560 }}>
        {[
          { label: "Txosnak", value: MOCK_ASSOCIATION.txosnak.length, accent: "#e85d2f" },
          { label: "Eskariak gaur", value: totalOrders, accent: "#3b82f6" },
          { label: "Diru-sarrerak gaur", value: `${totalRevenue} €`, accent: "#22c55e" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--adm-text-sec)", marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 26, fontWeight: 800, color: s.accent, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Txosna cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {txosnak.map(tx => (
          <div key={tx.id} style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 14, overflow: "hidden" }}>
            {/* Card header */}
            <div style={{ padding: "16px 20px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--adm-border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: STATUS_COLOR[tx.status], display: "inline-block", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--adm-text-pri)" }}>{tx.name}</div>
                  {tx.location && <div style={{ fontSize: 12, color: "var(--adm-text-sec)" }}>{tx.location}</div>}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: STATUS_COLOR[tx.status], fontWeight: 600 }}>{STATUS_LABEL[tx.status]}</span>
                {tx.waitMinutes && <span style={{ fontSize: 12, color: "var(--adm-text-sec)" }}>⏱ {tx.waitMinutes} min</span>}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 24, borderBottom: "1px solid var(--adm-border)" }}>
              <div style={{ fontSize: 13, color: "var(--adm-text-sec)" }}>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "var(--adm-text-pri)" }}>{tx.ordersToday ?? 0}</span> eskaera gaur
              </div>
              <div style={{ fontSize: 13, color: "var(--adm-text-sec)" }}>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "var(--adm-text-pri)" }}>{tx.revenueToday ?? 0} €</span> diru-sarrera
              </div>
              <div style={{ fontSize: 13, color: "var(--adm-text-sec)" }}>{tx.counterSetup === "SEPARATE" ? "Banandutako mostradoreak" : "Mostradore bakarra"}</div>
            </div>

            {/* Quick links */}
            <div style={{ padding: "10px 14px", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {[
                { label: "Hasiera",        href: `/eu/txosnak/${tx.id}`,            icon: "📊" },
                { label: "Menua",          href: `/eu/txosnak/${tx.id}/menu`,       icon: "🍽" },
                { label: "Konfigurazioa",  href: `/eu/txosnak/${tx.id}/settings`,   icon: "⚙️" },
                { label: "Txostena",       href: `/eu/txosnak/${tx.id}/reports`,    icon: "📈" },
              ].map(l => (
                <Link key={l.href} href={l.href} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--adm-border)", background: "var(--adm-surface-hi)", textDecoration: "none", fontSize: 12, fontWeight: 500, color: "var(--adm-text-sec)", transition: "border-color 0.12s, color 0.12s" }}>
                  <span>{l.icon}</span><span>{l.label}</span>
                </Link>
              ))}
              <button
                onClick={() => handleCloneClick(tx)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 5, 
                  padding: "6px 12px", 
                  borderRadius: 8, 
                  border: "1px dashed var(--adm-border)", 
                  background: "transparent", 
                  fontSize: 12, 
                  fontWeight: 500, 
                  color: "var(--adm-text-sec)",
                  cursor: "pointer",
                  transition: "border-color 0.12s, color 0.12s"
                }}
              >
                <span>📋</span><span>Klonatu</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Clone Dialog */}
      {selectedTxosna && (
        <CloneDialog
          txosna={selectedTxosna}
          isOpen={cloneDialogOpen}
          onClose={() => {
            setCloneDialogOpen(false);
            setSelectedTxosna(null);
          }}
          onConfirm={handleCloneConfirm}
        />
      )}
    </div>
  );
}
