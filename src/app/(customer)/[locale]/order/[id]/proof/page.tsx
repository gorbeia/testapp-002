"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_TXOSNA } from "@/lib/mock-data";

export default function ProofPage() {
  const params = useParams();

  // Request screen wake lock so device stays on
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    if ("wakeLock" in navigator) {
      (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } })
        .wakeLock.request("screen").then(wl => { wakeLock = wl; }).catch(() => {});
    }
    return () => { wakeLock?.release(); };
  }, []);

  return (
    <div className="cust-theme" style={{ minHeight: "100vh", background: "var(--cust-accent, #2d5a3d)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <div style={{ fontSize: 14, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{MOCK_TXOSNA.name}</div>
      <div style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>Erakutsi zure eskaera jasotzeko</div>

      <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 96, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.04em", marginBottom: 24 }}>#42</div>

      <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 16, padding: "16px 32px", marginBottom: 32 }}>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Egiaztapen kodea</div>
        <div style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "0.2em" }}>GH-7421</div>
      </div>

      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 40 }}>Pantaila pizturik mantentzen da</div>

      <Link href={`/eu/order/${params.id}`} style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: "12px 24px", color: "#fff", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
        ← Egoerara itzuli
      </Link>
    </div>
  );
}
