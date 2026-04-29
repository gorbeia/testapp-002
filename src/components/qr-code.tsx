'use client';
import { QRCodeSVG } from 'qrcode.react';

export function QrCode({ value, size = 128 }: { value: string; size?: number }) {
  return <QRCodeSVG value={value} size={size} />;
}
