import { useState, useEffect } from "react";

// ── i18n — Basque ─────────────────────────────────────────────────────────────
const eu = {
  ready: "PREST",
  inPrep: "PRESTATZEN",
  waitTime: "itxaron ~",
  waitMin: "min",
  orderNum: "#",
  paused: "Momentuz ezin da eskaerarik hartu — laster itzuliko gara",
  closed: "Gaur ez dago zerbitzurik",
  pausedTitle: "GELDITUTA",
  closedTitle: "ITXITA",
};

// ── Tokens (mirrors kds-prototype) ───────────────────────────────────────────
const T = {
  bg: "#0d0f14",
  surface: "#151821",
  surfaceHi: "#1c2030",
  border: "#252836",
  borderHi: "#2e3348",
  orange: "#e8622f",
  green: "#22c55e",
  greenDark: "#14532d",
  amber: "#f59e0b",
  amberDark: "#78350f",
  blue: "#3b82f6",
  red: "#ef4444",
  textPri: "#f0f2f8",
  textSec: "#8b92a8" },
  { id: "o2", number: 34, name: "Josu",    status: "READY",          slowOrder: false },
  { id: "o3", number: 38, name: null,      status: "READY",          slowOrder: false },
  { id: "o4", number: 29, name: "Ander",   status: "IN_PREPARATION", slowOrder: false },
  { id: "o5", number: 32, name: "Leire",   status: "IN_PREPARATION", slowOrder: false },
  { id: "o6", number: 33, name: "Ibai",    status: "IN_PREPARATION", slowOrder: false },
  { id: "o7", number: 35, name: "Aitor",   status: "IN_PREPARATION", slowOrder: true  },
  { id: "o8", number: 37, name: null,      status: "IN_PREPARATION", slowOrder: false },
  { id: "o9", number: 39, name: "Amaia",   status: "IN_PREPARATION", slowOrder: false },
];

const NAME_POOL = ["Gorka","Izaro","Xabi","Ane","Mikel","Nerea","Unai","Saioa","Eneko","Olatz","Beñat","Irati"];

let _nameIdx = 0;
let _numIdx  = 45;

function nextOrder() {
  const name = Math.random() > 0.25 ? NAME_POOL[_nameIdx++ % NAME_POOL.length] : null;
  return { id: `o${Date.now()}`, number _numIdx++, name, status: "IN_PREPARATION", slowOrder: false };
}

// ── Hooks ─────────────────────────────────────────────────────────────────────
function useWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return w;
}

// ── Ready card ────────────────────────────────────────────────────────────────
function ReadyCard({ order, animIn }) {
  return (
    <div
      style={{
        background: T.greenDark,
        border: `2px solid ${T.green}`,
        borderRadius: 14,
        padding: "14px 18px",
        displ >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 28,
            fontWeight: 800,
            color: T.green,
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          #{order.number}
        </span>
        {order.name && (
          <span
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: 22,
              fontWeight: 800,
              color: "#fff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {order.name.toUpperCase()}
          </span>
        )}
      </div>
      <span style={{ fontSize: 22, flexShrink: 0 }}>✓</span>
    </div>
  );
}

// ── In-prep row ─────────────────────────────────────────        background: order.slowOrder ? T.amberDark : T.surfaceHi,
        border: `1px solid ${order.slowOrder ? T.amber : T.border}`,
        borderRadius: 10,
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        transition: "background 0.3s, border-color 0.3s",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 20,
            fontWeight: 700,
            color: order.slowOrder ? T.amber : T.textSec,
            flexShrink: 0,
          }}
        >
          #{order.number}
        </span>
        {order.name && (
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: order.slowOrder ? T.amber : T.textPri,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {order.name}
          </span>
        )}
      </div>
      {order.slowOrder && (
        <span style={{ fontSize: 16, flexShrink: 0 }} title="Motel">⏱</span>
      )}
    </div>
  );
}

// ── Wait time pill ────────────────────────────────────────────────────────────
function WaitPill({ minutes }) {
  if (!minutes) return null;
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.borderHi}`,
        borderRadius: 99,
        padding: "6px 18px",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 15,
        color: T.textSec,
      }}
    >
      <span style={{ color: T.amber }}>⏱</span>
      <span>{eu.waitTime}</span>
      <span
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontWeight: 800,
          fontSize: 18,
          color: T.textPri,
        }}
      >
        {minutes}
      </span>
      <span>{eu.waitMin}</span>
    </div>
  );
}

// ── Status overlay ─────────────────────────────────────────────────────────────
function StatusOverlay({ type }) {
   justifyContent: "center",
        gap: 16,
        zIndex: 100,
      }}
    >
      <span style={{ fontSize: 56 }}>{isPaused ? "⏸" : "🔒"}</span>
      <h1
        style={{
      fontFamily: "'Nunito',sans-serif",
          fontSize: 36,
          fontWeight: 900,
          color: isPaused ? T.amber : T.textSec,
          letterSpacing: "0.06em",
        }}
      >
        {isPaused ? eu.pausedTitle : eu.closedTitle}
      </h1>
      <p style={{ fontSize: 18, color: T.textSec, textAlign: "center", maxWidth: 480 }}>
        {isPaused ? eu.paused : eu.closed}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OrderBoard() {
  const width = useWidth();
  const isPortrait = width < 768;

  const [orders, setOrders]       = useState(INITIAL_ORDERS);
  const [newIds, setNewIds]       = useState(new Set()); // tracks slide-in animation
  const [simMode, setSimMode]     = useState("open");    // "open" | "paused" | "closed"
  const [wsimMode !== "open") return;
    const id = setInterval(() => {
      setOrders(prev => {
        const prepOrders = prev.filter(o => o.status === "IN_PREPARATION");
        const coin = Math.random();

        if (coin < 0.40 && prepOrders.length > 0) {
          // advance oldest prep → READY with slide-in
          const target = prepOrders.reduce((a, b) => a.number < b.number ? a : b);
          setNewIds(s => new Set([...s, target.id]))          setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(target.id); return n; }), 600);
          return prev.map(o => o.id === target.id ? { ...o, status: "READY" } : o);
        }

        if (coin < 0.65) {
          // remove oldest ready (collected)
          const readyOrders = prev.filter(o => o.status === "READY");
          if (readyOrders.length > 0) {
            const oldest = readyOrders.reduce((a, b) => a.number < b.number ? a : b);
            return prev.filter(o => o.id !== oldest.id);
          }
        }

        // add new prep order
        if (prepOrders.length < 12) {
          const o = nextOrder();
          return [...prev, o];
        }
        return prev;
      });
    }, 3200);
    return () => clearInterval(id);
  }, [simMode]);

  const readyOrders = orders.filter(o => o.status === "READY").sort((a, b) => a.number - b.number);
  const prepOrders  = orders.filter(o => o.status === "IN_PREPARATION").sort((a, b) => a.number - b.number);

  // ── Layout: landscape (TV / desktop) ─────────────────────────────────────
  const LandscapeLayout = () => (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", gap: 0 }}>
      {/* READY column — left, narrow, high impact */}
      <div
        style={{
          )",
          borderRight: `2px solid ${T.green}30`,
          display: "flex",
          flexDirection: "column",
          padding: "20px 20px 24px",
          gap: 0,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
            paddingBottom: 14,
            borderBottom: `2px solid ${T.green}`,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: T.green,
            }}
          >
            {eu.ready}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 14,
              fontWeight: 800,
              color: T.textPri,
              background: T.surfaceHi,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: "2px 9px",
            }}
          >
            {readyOrders.length}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {readyOrders.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 16px",
                color: T.textDim,
                fontSize: 14,
                border: `1px dashed ${T.border}`,
                borderRadius: 14,
              }}
            >
              —
            </div>
          ) : (
            readyOrders.map(o => (
              <ReadyCard key={o.id} order={o} animIn={newIds.has(o.id)} />
            ))
          )}
        </div>
      </div>

      {/* IN_PPARATION column — right */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "20px 24px 24px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 18,
            paddingBottom: 14,
            borderBottom: `2px solid ${T.amber}`,
          }}
        >
          pan
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: T.amber,
            }}
          >
            {eu.inPrep}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 14,
              fontWeight: 800,
              color: T.textPri,
              background: T.surfaceHi,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: "2px 9px",
            }}
          >
            {prepOrders.length}
          </span>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: 10,
            alignContent: "start",
          }}
        >
          {prepOrders.length === 0 ? (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "48px",
                color: T.textDim,
                fontSize: 14,
                border: `1px dashed ${T.border}`,
                borderRadius: 14,
              }}
            >
              —
            </div>
          ) : (
            prepOrders.map(o => <PrepRow key={o.id} order={o} />)
          )}
        </div>
      </div>
    </div>
  );

  // ── Layout: portrait (phone / small tablet) ───────────────────────────────
  const PortraitLayout = () => (
    <div style={{ display: "flex", flexDirection: "column", padding: "16px 14px 32px", gap: 24 }}>
      {/* READY — top, full width */}
      {rele={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: `2px solid ${T.green}`,
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: T.green,
              }}
            >
              {eu.ready}
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 13,
                fontWeight: 700,
                color: T.textPri,
                background: T.surfaceHi,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "1px 7px",
              }}
            >
              {readyOrders.length}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {readyOrders.map(o => (
              <ReadyCard key={o.id} order={o} animIn={newIds.has(o.id)} />
            ))}
          </div>
        </div>
      )}

      {/* IN_PREP */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: `2px solid ${T.amber}`,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: T.amber,
            }}
          >
            {eu.inPrep}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 13,
              fontWeight: 700,
              color: T.textPri,
              background: T.surfaceHi,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: "1px 7px",
            }}
          >
            {prepOrders.length}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {prepOrders.map(o => <PrepRow key={o.id} order={o} />)}
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'DM Sans',system-ui,sans-serif",
        color: T.textPri,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@800;900&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: inherit; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 99px; }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-24px) scale(0.96); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 18px rgba(34,197,94,0.22); }
          50%      { box-shadow: 0 0 32px rgba(34,197,94,0.5); }
        }
      `}</style>

      {/* ── Top bar ── */}
      <div
        style={{
          background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          padding: isPortrait ? "10px 14px" : "12px 28px"    display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: 64,
        }}
      >
        {/* Identity */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: simMode === "open" ? T.green : simMode === "paused" ? T.amber : T.textDim,
              boxShadow: simMode === "open" ? `0 0 7px ${T.green}` : "none",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Nunito',sans-serif",
              fontSize: isPortrait ? 16 : 20,
              fontWeight: 900,
              color: T.textPri,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Aste Nagusia 2026
          </span>
        </div>

        {/* Right: wait time + sim controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {simMode === "open" && <WaitPill minutes={waitMin} />}

          {/* Sim controls — demo only */}
          <div
            style={{
              display: "flex",
              gap: 4,
              background: T.surfaceHi,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              padding: "3px 4px",
            }}
          >
            {["open", "paused", "closed"].map(mode => (
              <button
                key={mode}
                onClick={() => setSimMode(mode)}
                style={{
                  background: simMode === mode ? T.borderHi : "none",
                  border: "none",
                  borderRadius: 6,
                  padding: "5px 10px",
                color: simMode === mode ? T.textPri : T.textDim,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {mode === "open" ? "▶" : mode === "paused" ? "⏸" : "✕"}
              </button>
            ))}
          </div>
        </d    </div>

      {/* ── Main content ── */}
      {isPortrait ? <PortraitLayout /> : <LandscapeLayout />}

      {/* ── Overlays ── */}
      {simMode === "paused" && <StatusOverlay type="paused" />}
      {simMode === "closed" && <StatusOverlay type="closed" />}
    </div>
  );
}
