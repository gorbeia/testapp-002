"use client";
import { useState, useEffect } from "react";
import { Ticket, KdsProduct } from "./types";
import { TicketCard } from "./ticket-card";
import { InstructionsOverlay } from "./instructions-overlay";
import { StockPanel } from "./stock-panel";
import { OverflowMenu } from "./overflow-menu";

// ── Multi-txosna mock data ────────────────────────────────────────────────────
const MOCK_TXOSNAK = [
  { id: "tx-1", name: "Aste Nagusia 2026", role: "Janaria · Sukaldea" },
  { id: "tx-2", name: "Pintxo Txokoa",     role: "Janaria · Sukaldea" },
  { id: "tx-3", name: "Garagardo Barra",   role: "Edariak · Barra" },
];

const INITIAL_TICKETS: Ticket[] = [
  { id: "t1", orderNumber: 41, customerName: "Josu",  status: "RECEIVED",       elapsedMin: 0,  isSlowOrder: false, hasAlert: false, lines: [{name:"Burgerra",qty:2,detail:"Kendu: Tipula, Saltsa"},{name:"Entsalada",qty:1,detail:"alkate-saltsa barik"},{name:"Pintxo nahasia",qty:3,detail:null}], notes: "Burgerra ondo eginda mesedez" },
  { id: "t2", orderNumber: 38, customerName: "Miren", status: "RECEIVED",       elapsedMin: 2,  isSlowOrder: false, hasAlert: false, lines: [{name:"Txorizoa ogian",qty:2,detail:null},{name:"Tortilla",qty:1,detail:"2tan banatu"}], notes: null },
  { id: "t3", orderNumber: 36, customerName: "Ander", status: "IN_PREPARATION", elapsedMin: 6,  isSlowOrder: false, hasAlert: true,  lines: [{name:"Burgerra",qty:1,detail:"Kendu: Letxuga, Tomatea"},{name:"Pintxo nahasia",qty:2,detail:null}], notes: null },
  { id: "t4", orderNumber: 33, customerName: "Leire", status: "IN_PREPARATION", elapsedMin: 14, isSlowOrder: true,  hasAlert: false, lines: [{name:"Burgerra",qty:1,detail:"patata frijituak"},{name:"Tortilla",qty:2,detail:null},{name:"Ogia gurinarekin",qty:2,detail:null}], notes: "Burgerra glutenik gabeko ogian" },
  { id: "t5", orderNumber: 31, customerName: "Ibai",  status: "READY",          elapsedMin: 3,  isSlowOrder: false, hasAlert: false, lines: [{name:"Burgerra",qty:1,detail:"patata frijituak"},{name:"Freskagarria",qty:2,detail:null}], notes: null },
  { id: "t6", orderNumber: 29, customerName: null,    status: "READY",          elapsedMin: 5,  isSlowOrder: false, hasAlert: false, lines: [{name:"Txorizoa ogian",qty:3,detail:null}], notes: null },
];

const NEW_ORDER_POOL = [
  { name: "Gorka", lines: [{name:"Burgerra",qty:1,detail:"entsalada"},{name:"Pintxo nahasia",qty:2,detail:null}], notes: null },
  { name: "Xabi",  lines: [{name:"Tortilla",qty:3,detail:"2tan banatu"},{name:"Ogia gurinarekin",qty:1,detail:null}], notes: "Azkar mesedez" },
  { name: null,    lines: [{name:"Txorizoa ogian",qty:2,detail:null},{name:"Entsalada",qty:1,detail:"alkate-saltsa barik"}], notes: null },
  { name: "Amaia", lines: [{name:"Burgerra",qty:2,detail:"patata frijituak"},{name:"Pintxo nahasia",qty:1,detail:null}], notes: "Burgerrak ondo eginda" },
];

function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 900);
  useEffect(() => { const f = () => setW(window.innerWidth); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return w;
}

const COL_DEFS = [
  { status: "RECEIVED"       as const, label: "Jasota",     accent: "var(--ops-blue, #3b82f6)" },
  { status: "IN_PREPARATION" as const, label: "Prestatzen", accent: "var(--ops-amber, #f59e0b)" },
  { status: "READY"          as const, label: "Prest",      accent: "var(--ops-green)" },
];

export default function KdsBoard() {
  const width = useWidth();
  const isMobile  = width < 640;
  const isTablet  = width >= 640 && width < 1024;

  const [activeTxosnaId, setActiveTxosnaId] = useState(MOCK_TXOSNAK[0].id);
  const [showTxosnaPicker, setShowTxosnaPicker] = useState(false);
  const activeTxosna = MOCK_TXOSNAK.find(t => t.id === activeTxosnaId)!;

  const [tickets, setTickets]     = useState<Ticket[]>(INITIAL_TICKETS);
  const [paused, setPaused]       = useState(false);
  const [closed, setClosed]       = useState(false);
  const [activeTab, setActiveTab] = useState<"RECEIVED" | "IN_PREPARATION" | "READY">("RECEIVED");
  const [instrTicket, setInstrTicket] = useState<Ticket | null>(null);
  const [showStock, setShowStock] = useState(false);
  const [orderIdx, setOrderIdx]   = useState(0);
  const [products, setProducts]   = useState<KdsProduct[]>([
    { name: "Burgerra", soldOut: false }, { name: "Tortilla", soldOut: false },
    { name: "Entsalada", soldOut: true }, { name: "Pintxo nahasia", soldOut: false },
    { name: "Txorizoa ogian", soldOut: false }, { name: "Ogia gurinarekin", soldOut: false },
  ]);

  const advance = (id: string) => setTickets(prev =>
    prev.map(t => {
      if (t.id !== id) return t;
      const next = ({ RECEIVED: "IN_PREPARATION", IN_PREPARATION: "READY", READY: "COMPLETED" } as Record<string, string>)[t.status];
      if (!next || next === "COMPLETED") return { ...t, status: "COMPLETED" as never };
      return { ...t, status: next as Ticket["status"], elapsedMin: 0, hasAlert: false };
    }).filter(t => t.status !== ("COMPLETED" as never))
  );

  const addOrder = () => {
    const tmpl = NEW_ORDER_POOL[orderIdx % NEW_ORDER_POOL.length];
    setOrderIdx(i => i + 1);
    setTickets(prev => [...prev, {
      id: `t${Date.now()}`,
      orderNumber: Math.max(0, ...prev.map(t => t.orderNumber), 40) + 1,
      customerName: tmpl.name,
      status: "RECEIVED",
      elapsedMin: 0,
      isSlowOrder: false,
      hasAlert: false,
      lines: tmpl.lines,
      notes: tmpl.notes,
    }]);
    if (isMobile) setActiveTab("RECEIVED");
  };

  const byStatus = (s: Ticket["status"]) => tickets.filter(t => t.status === s).sort((a, b) => a.orderNumber - b.orderNumber);
  const counts = { RECEIVED: byStatus("RECEIVED").length, IN_PREPARATION: byStatus("IN_PREPARATION").length, READY: byStatus("READY").length };
  const nextTicketId = byStatus("RECEIVED")[0]?.id ?? null;
  const soldOutCount = products.filter(p => p.soldOut).length;
  const slowCount    = byStatus("IN_PREPARATION").filter(t => t.isSlowOrder).length;

  if (closed) {
    return (
      <div className="ops-theme" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontFamily: "var(--font-nunito, sans-serif)", fontSize: 24, fontWeight: 800, color: "var(--ops-text-pri)", marginBottom: 8 }}>Jardunaldia itxita</h1>
          <p style={{ color: "var(--ops-text-sec)", fontSize: 15 }}>Eskaera guztiak ezeztatuta daude.</p>
        </div>
      </div>
    );
  }

  const renderTicketList = (status: Ticket["status"], tabActive = true) => {
    const list = byStatus(status);
    if (!tabActive) return null;
    return list.length === 0
      ? <div style={{ textAlign: "center", padding: "48px 16px", color: "var(--ops-text-dim)", fontSize: 14, border: "1px dashed var(--ops-border)", borderRadius: 14 }}>{status === "READY" ? "Prest dagoen eskaera gabe" : "Eskaera gabe"}</div>
      : list.map(t => <TicketCard key={t.id} ticket={t} onAdvance={advance} onShowInstructions={() => setInstrTicket(t)} isNext={t.id === nextTicketId && status === "RECEIVED"} />);
  };

  return (
    <div className="ops-theme" style={{ minHeight: "100vh", fontFamily: "var(--font-dm-sans, system-ui, sans-serif)", color: "var(--ops-text-pri)" }}>
      {/* Top bar */}
      <div style={{ background: "var(--ops-surface)", borderBottom: "1px solid var(--ops-border)", padding: isMobile ? "10px 14px" : "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50, gap: 10 }}>
        <div style={{ minWidth: 0, position: "relative" }}>
          <button onClick={() => setShowTxosnaPicker(v => !v)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ fontFamily: "var(--font-nunito, sans-serif)", fontSize: isMobile ? 14 : 17, fontWeight: 800, color: "var(--ops-text-pri)", letterSpacing: "-0.02em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeTxosna.name}</div>
            <span style={{ color: "var(--ops-text-dim)", fontSize: 12 }}>▾</span>
          </button>
          <div style={{ fontSize: 11, color: "var(--ops-text-sec)", marginTop: 1, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: paused ? "var(--ops-amber, #f59e0b)" : "var(--ops-green)", flexShrink: 0 }} />
            <span style={{ whiteSpace: "nowrap" }}>{paused ? "GELDITUTA" : activeTxosna.role}</span>
            {!isMobile && slowCount > 0 && <span style={{ color: "var(--ops-red)", fontWeight: 700, marginLeft: 8 }}>· ⚠ {slowCount} motel</span>}
          </div>
          {showTxosnaPicker && (
            <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, background: "var(--ops-surface)", border: "1px solid var(--ops-border-hi)", borderRadius: 12, minWidth: 220, zIndex: 100, overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              <div style={{ padding: "8px 12px 6px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ops-text-dim)" }}>Txosna aldatu</div>
              {MOCK_TXOSNAK.map(tx => (
                <button key={tx.id} onClick={() => { setActiveTxosnaId(tx.id); setShowTxosnaPicker(false); }} style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", background: tx.id === activeTxosnaId ? "var(--ops-surface-hi)" : "transparent", border: "none", borderTop: "1px solid var(--ops-border)", padding: "10px 14px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ops-text-pri)" }}>{tx.name}</span>
                  <span style={{ fontSize: 11, color: "var(--ops-text-dim)" }}>{tx.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          <button onClick={() => setShowStock(true)} style={{ position: "relative", background: "var(--ops-surface-hi)", border: `1px solid ${soldOutCount > 0 ? "var(--ops-red)" : "var(--ops-border)"}`, borderRadius: 8, padding: "7px 12px", color: soldOutCount > 0 ? "var(--ops-red)" : "var(--ops-text-sec)", fontSize: 12, fontWeight: soldOutCount > 0 ? 700 : 400, cursor: "pointer", minHeight: 36, display: "flex", alignItems: "center", gap: 5 }}>
            📦{!isMobile && <span style={{ marginLeft: 2 }}>Stocka</span>}
            {soldOutCount > 0 && <span style={{ background: "var(--ops-red)", color: "#fff", borderRadius: 99, fontSize: 10, fontWeight: 800, padding: "1px 5px", marginLeft: 2 }}>{soldOutCount}</span>}
          </button>
          <button onClick={addOrder} style={{ background: "var(--ops-orange)", border: "none", borderRadius: 8, padding: "7px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 36, whiteSpace: "nowrap" }}>
            + Eskaera
          </button>
          <OverflowMenu paused={paused} onPause={() => setPaused(true)} onResume={() => setPaused(false)} onClose={() => { setTickets([]); setClosed(true); }} />
        </div>
      </div>

      {paused && <div style={{ background: "var(--ops-amber-dim, #78350f)", borderBottom: "1px solid rgba(245,158,11,0.25)", padding: "9px 16px", fontSize: 12, fontWeight: 700, color: "var(--ops-amber, #f59e0b)", textAlign: "center", letterSpacing: "0.04em" }}>⏸ Sukaldea geldituta — ez da eskaera berririk onartzen</div>}

      {/* Mobile tabs */}
      {isMobile && (
        <div style={{ display: "flex", background: "var(--ops-surface)", borderBottom: "1px solid var(--ops-border)", position: "sticky", top: 56, zIndex: 40 }}>
          {COL_DEFS.map(tab => (
            <button key={tab.status} onClick={() => setActiveTab(tab.status)} style={{ flex: 1, background: "none", border: "none", borderBottom: `3px solid ${activeTab === tab.status ? tab.accent : "transparent"}`, padding: "10px 4px 8px", color: activeTab === tab.status ? tab.accent : "var(--ops-text-dim)", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "color 0.15s" }}>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 20, fontWeight: 800, lineHeight: 1 }}>{counts[tab.status]}</span>
              <span style={{ fontSize: 10 }}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Mobile single column */}
      {isMobile && (
        <div style={{ padding: "16px 14px 80px", display: "flex", flexDirection: "column", gap: 12 }}>
          {renderTicketList(activeTab)}
        </div>
      )}

      {/* Tablet 2-column */}
      {isTablet && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: "18px 18px 32px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {COL_DEFS.slice(0, 2).map(col => (
              <div key={col.status}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: `2px solid ${col.accent}` }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: col.accent }}>{col.label}</span>
                  <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, fontWeight: 700, color: "var(--ops-text-pri)", background: "var(--ops-surface-hi)", border: "1px solid var(--ops-border)", borderRadius: 6, padding: "1px 7px" }}>{counts[col.status]}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{renderTicketList(col.status)}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 10, marginBottom: 10, borderBottom: `2px solid ${COL_DEFS[2].accent}` }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: COL_DEFS[2].accent }}>{COL_DEFS[2].label}</span>
              <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, fontWeight: 700, color: "var(--ops-text-pri)", background: "var(--ops-surface-hi)", border: "1px solid var(--ops-border)", borderRadius: 6, padding: "1px 7px" }}>{counts.READY}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{renderTicketList("READY")}</div>
          </div>
        </div>
      )}

      {/* Desktop 3-column */}
      {!isMobile && !isTablet && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, padding: "20px 24px 32px", alignItems: "start" }}>
          {COL_DEFS.map(col => (
            <div key={col.status}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 12, marginBottom: 12, borderBottom: `2px solid ${col.accent}` }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: col.accent }}>{col.label}</span>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 13, fontWeight: 700, color: "var(--ops-text-pri)", background: "var(--ops-surface-hi)", border: "1px solid var(--ops-border)", borderRadius: 6, padding: "1px 7px" }}>{counts[col.status]}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{renderTicketList(col.status)}</div>
            </div>
          ))}
        </div>
      )}

      {instrTicket && <InstructionsOverlay ticket={instrTicket} onClose={() => setInstrTicket(null)} />}
      {showStock && <StockPanel products={products} onToggle={i => setProducts(prev => prev.map((p, idx) => idx === i ? { ...p, soldOut: !p.soldOut } : p))} onClose={() => setShowStock(false)} />}
    </div>
  );
}
