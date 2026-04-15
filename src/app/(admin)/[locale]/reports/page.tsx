"use client";
import { useState } from "react";
import { MOCK_ORDERS, MOCK_TXOSNA, MOCK_PRODUCTS, MOCK_TICKETS } from "@/lib/mock-data";

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<"today" | "week" | "all">("today");

  // Filter orders by selected range (mock: "today"=last 2, "week"=last 3, "all"=all 4)
  const filteredOrders = dateRange === "today"
    ? MOCK_ORDERS.slice(-2)
    : dateRange === "week"
    ? MOCK_ORDERS.slice(-3)
    : MOCK_ORDERS;

  // Calculate stats from filtered data
  const totalOrders = filteredOrders.length;
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const completedOrders = filteredOrders.filter(o => o.status === "CONFIRMED").length;
  const pendingOrders = filteredOrders.filter(o => o.status === "PENDING_PAYMENT").length;

  // Product popularity (scaled with date range)
  const scale = dateRange === "today" ? 0.4 : dateRange === "week" ? 0.7 : 1;
  const productStats = MOCK_PRODUCTS.slice(0, 5).map((p, i) => {
    const count = Math.max(1, Math.round([12, 8, 6, 5, 4][i] * scale));
    return { name: p.name, count, revenue: count * p.price };
  }).sort((a, b) => b.count - a.count);

  // Ticket stats
  const ticketStats = {
    received: MOCK_TICKETS.filter(t => t.status === "RECEIVED").length,
    inPrep: MOCK_TICKETS.filter(t => t.status === "IN_PREPARATION").length,
    ready: MOCK_TICKETS.filter(t => t.status === "READY").length,
    completed: MOCK_TICKETS.filter(t => t.status === "COMPLETED").length,
  };

  return (
    <div style={{ padding: "32px 32px 60px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "var(--font-nunito, sans-serif)", fontSize: 26, fontWeight: 800, color: "var(--adm-text-pri)", margin: "0 0 4px" }}>
          Txostena
        </h1>
        <div style={{ fontSize: 14, color: "var(--adm-text-sec)" }}>
          {MOCK_TXOSNA.name} · Gertaera amaierako laburpena
        </div>
      </div>

      {/* Date range selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[
          { key: "today", label: "Gaur" },
          { key: "week", label: "Asteburu" },
          { key: "all", label: "Guztia" },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setDateRange(opt.key as typeof dateRange)}
            style={{
              background: dateRange === opt.key ? "var(--adm-text-pri)" : "var(--adm-surface-hi)",
              border: "1px solid var(--adm-border)",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: dateRange === opt.key ? "var(--adm-surface)" : "var(--adm-text-pri)",
            }}
          >
            {opt.label}
          </button>
        ))}
        <button
          style={{
            marginLeft: "auto",
            background: "#e85d2f",
            border: "none",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            color: "#ffffff",
          }}
        >
          ↓ Esportatu CSV
        </button>
      </div>

      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--adm-text-sec)", marginBottom: 8 }}>Eskariak</div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 32, fontWeight: 800, color: "var(--adm-text-pri)" }}>{totalOrders}</div>
          <div style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>{completedOrders} baieztatuta</div>
        </div>
        <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--adm-text-sec)", marginBottom: 8 }}>Diru-sarrera</div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 32, fontWeight: 800, color: "var(--adm-text-pri)" }}>{totalRevenue.toFixed(0)}€</div>
          <div style={{ fontSize: 12, color: "var(--adm-text-sec)", marginTop: 4 }}>guztira</div>
        </div>
        <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--adm-text-sec)", marginBottom: 8 }}>Batez besteko</div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 32, fontWeight: 800, color: "var(--adm-text-pri)" }}>{avgOrderValue.toFixed(2)}€</div>
          <div style={{ fontSize: 12, color: "var(--adm-text-sec)", marginTop: 4 }}>eskaera bakoitzeko</div>
        </div>
        <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 12, padding: "18px 20px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--adm-text-sec)", marginBottom: 8 }}>Zain</div>
          <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 32, fontWeight: 800, color: pendingOrders > 0 ? "#f59e0b" : "var(--adm-text-pri)" }}>{pendingOrders}</div>
          <div style={{ fontSize: 12, color: "var(--adm-text-sec)", marginTop: 4 }}>ordainketa zain</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Product popularity */}
        <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--adm-text-pri)", marginBottom: 16 }}>Produktu salduenak</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {productStats.map((p, i) => (
              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 12, fontWeight: 700, color: "var(--adm-text-dim)", width: 20 }}>
                  {i + 1}.
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--adm-text-pri)" }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--adm-text-sec)" }}>{p.count} saldu · {p.revenue.toFixed(0)}€</div>
                </div>
                <div style={{ width: 80, height: 6, background: "var(--adm-surface-hi)", borderRadius: 3, overflow: "hidden" }}>
                  <div 
                    style={{ 
                      width: `${(p.count / productStats[0].count) * 100}%`, 
                      height: "100%", 
                      background: "#e85d2f",
                      borderRadius: 3 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket flow */}
        <div style={{ background: "var(--adm-surface)", border: "1px solid var(--adm-border)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--adm-text-pri)", marginBottom: 16 }}>Txartelen egoera</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Jasota", count: ticketStats.received, color: "#3b82f6" },
              { label: "Prestatzen", count: ticketStats.inPrep, color: "#f59e0b" },
              { label: "Prest", count: ticketStats.ready, color: "#22c55e" },
              { label: "Osatuta", count: ticketStats.completed, color: "var(--adm-text-sec)" },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--adm-surface-hi)", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color }} />
                  <span style={{ fontSize: 14, color: "var(--adm-text-pri)" }}>{s.label}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 16, fontWeight: 700, color: "var(--adm-text-pri)" }}>{s.count}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--adm-border)" }}>
            <div style={{ fontSize: 12, color: "var(--adm-text-sec)", marginBottom: 8 }}>Gertaeraren datuak</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span>Iraupena:</span>
              <span style={{ fontWeight: 600, color: "var(--adm-text-pri)" }}>4 ordu</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 4 }}>
              <span>Boluntario orduak:</span>
              <span style={{ fontWeight: 600, color: "var(--adm-text-pri)" }}>16h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
