"use client";
import React, { useState } from "react";

interface MaskedInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function MaskedInput({ value, onChange, placeholder, className }: MaskedInputProps) {
  const [show, setShow] = useState(false);
  return (
    <div className={`flex gap-2 ${className || ""}`}>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid var(--adm-border, #2a2d3a)",
          background: "var(--adm-surface, #1a1d27)",
          fontSize: 14,
          fontFamily: "JetBrains Mono, monospace",
          color: "var(--adm-text-pri, #f8f9fa)",
          outline: "none",
        }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid var(--adm-border, #2a2d3a)",
          background: "var(--adm-surface-hi, #2a2d3a)",
          color: "var(--adm-text-sec, #9ca3af)",
          cursor: "pointer",
        }}
        aria-label={show ? "Hide value" : "Show value"}
      >
        {show ? "🙈" : "👁"}
      </button>
    </div>
  );
}
