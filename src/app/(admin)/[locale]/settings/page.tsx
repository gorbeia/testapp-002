'use client';
import { useState } from 'react';
import { GeneralTab } from './_general-tab';
import { PaymentProvidersTab } from './_payment-tab';
import { VatTab } from './_vat-tab';

const TABS = ['Elkartea', 'Ordainketa', 'BEZ'];

export default function AssociationSettingsPage() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div style={{ padding: '32px 32px 60px' }}>
      <h1
        style={{
          fontFamily: 'var(--font-nunito, sans-serif)',
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--adm-text-pri)',
          marginBottom: 20,
        }}
      >
        Elkartearen ezarpenak
      </h1>

      <div
        style={{ display: 'flex', borderBottom: '1px solid var(--adm-border)', marginBottom: 24 }}
      >
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 500,
              border: 'none',
              borderBottom: '2px solid',
              borderColor: activeTab === i ? '#e85d2f' : 'transparent',
              background: 'transparent',
              color: activeTab === i ? '#e85d2f' : 'var(--adm-text-sec)',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <GeneralTab />}
      {activeTab === 1 && <PaymentProvidersTab />}
      {activeTab === 2 && <VatTab />}
    </div>
  );
}
