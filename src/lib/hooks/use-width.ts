"use client";
import { useState, useEffect } from "react";

export function useWidth(fallback = 1200): number {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : fallback);
  useEffect(() => {
    const f = () => setW(window.innerWidth);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);
  return w;
}
