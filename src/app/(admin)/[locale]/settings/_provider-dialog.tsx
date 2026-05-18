'use client';
import React from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';

export function ProviderDialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
          }}
        />
        <Dialog.Popup
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'var(--adm-surface, #1a1d27)',
            border: '1px solid var(--adm-border, #2a2d3a)',
            borderRadius: 16,
            padding: 0,
            width: '90vw',
            maxWidth: 520,
            maxHeight: '85vh',
            overflow: 'auto',
            zIndex: 51,
            outline: 'none',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--adm-border, #2a2d3a)',
            }}
          >
            <Dialog.Title
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--adm-text-pri, #f8f9fa)',
                margin: 0,
              }}
            >
              {title}
            </Dialog.Title>
            <Dialog.Close
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: 'transparent',
                color: 'var(--adm-text-sec, #9ca3af)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </Dialog.Close>
          </div>
          <div style={{ padding: 24 }}>{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
