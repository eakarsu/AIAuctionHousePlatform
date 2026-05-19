import React from 'react';
import BidTimeline from '../components/BidTimeline';
import LotValueChart from '../components/LotValueChart';
import CatalogPDF from '../components/CatalogPDF';
import ConsignmentWizard from '../components/ConsignmentWizard';

export default function CustomViewsPage() {
  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: '#1a1a1a' }}>Auction Views</h1>
        <p style={{ color: '#666', marginTop: 6 }}>
          Auction-house specific dashboards, reports, and intake tools.
        </p>
      </div>

      <BidTimeline />
      <LotValueChart />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <CatalogPDF />
        <ConsignmentWizard />
      </div>
    </div>
  );
}
