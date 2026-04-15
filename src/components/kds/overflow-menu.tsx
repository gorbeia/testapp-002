"use client";
import { useState, useEffect, useRef } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface OverflowMenuProps {
  paused: boolean;
  onPause: () => void;
  onResume: () => void;
  onClose: () => void;
}

export function OverflowMenu({ paused, onPause, onResume, onClose }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<"pause" | "resume" | "close" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ background: open ? "var(--ops-surface-hi)" : "transparent", border: `1px solid ${open ? "var(--ops-border)" : "transparent"}`, borderRadius: 8, padding: "7px 10px", color: "var(--ops-text-dim)", fontSize: 18, cursor: "pointer", minHeight: 36, minWidth: 36, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
        aria-label="Aukerak"
      >⋯</button>

      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "var(--ops-surface)", border: "1px solid var(--ops-border-hi)", borderRadius: 12, padding: "6px", minWidth: 220, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 100 }}>
          <button
            onClick={() => { setOpen(false); setConfirm(paused ? "resume" : "pause"); }}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", borderRadius: 8, padding: "10px 14px", color: paused ? "var(--ops-green)" : "var(--ops-text-sec)", fontSize: 14, cursor: "pointer", textAlign: "left" }}
          >
            {paused ? "▶  Sukaldea jarraitu" : "⏸  Sukaldea gelditu"}
          </button>
          <div style={{ height: 1, background: "var(--ops-border)", margin: "4px 8px" }} />
          <button
            onClick={() => { setOpen(false); setConfirm("close"); }}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none", borderRadius: 8, padding: "10px 14px", color: "var(--ops-red)", fontSize: 14, cursor: "pointer", textAlign: "left" }}
          >
            ✕  Jardunaldia itxi
          </button>
        </div>
      )}

      {confirm === "pause" && (
        <ConfirmDialog
          title="Sukaldea gelditu?"
          message="Eskaera berriak blokeatuko dira. Uneko eskaerak jarraitzen dute. Edozein unetan berriro hasi daiteke."
          confirmLabel="Bai, gelditu"
          onConfirm={() => { setConfirm(null); onPause(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "resume" && (
        <ConfirmDialog
          title="Sukaldea jarraitu?"
          message="Eskaerak onartzen hasiko da berriro."
          confirmLabel="Bai, jarraitu"
          onConfirm={() => { setConfirm(null); onResume(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm === "close" && (
        <ConfirmDialog
          title="Jardunaldia itxi?"
          message="Ordaintze zain, jasota eta prestatzen dauden eskaera guztiak automatikoki ezeztatuko dira. Ekintza hau ezin da desegin."
          confirmLabel="Bai, itxi jardunaldia"
          confirmDanger
          onConfirm={() => { setConfirm(null); onClose(); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
