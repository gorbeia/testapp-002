'use client';
import { useState, useEffect } from 'react';

export function useWidth() {
  const [w, setW] = useState(1200);
  useEffect(() => {
    setW(window.innerWidth);
    const f = () => setW(window.innerWidth);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, []);
  return w;
}
