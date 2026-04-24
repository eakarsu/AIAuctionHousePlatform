import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const featureCards = [
  { icon: '🤝', title: 'Consignor Management', desc: 'Manage consignors, contracts, and commissions', path: '/consignors', countKey: 'consignors' },
  { icon: '🖼️', title: 'Item Cataloging', desc: 'Catalog and manage auction items', path: '/items', countKey: 'items' },
  { icon: '📅', title: 'Auction Calendar', desc: 'Schedule and organize auctions', path: '/auctions', countKey: 'auctions' },
  { icon: '🙋', title: 'Bidder Registration', desc: 'Register and verify bidders', path: '/bidders', countKey: 'bidders' },
  { icon: '🔨', title: 'Live Auctions', desc: 'Manage real-time bidding activity', path: '/live-auctions', countKey: 'bids' },
  { icon: '💰', title: 'Invoices & Settlement', desc: 'Generate invoices and track payments', path: '/invoices', countKey: 'invoices' },
  { icon: '🚚', title: 'Shipping & Logistics', desc: 'Track shipping and delivery', path: '/shipping', countKey: 'shipping' },
  { icon: '📋', title: 'Condition Reports', desc: 'Document item conditions', path: '/conditions', countKey: 'conditions' },
  { icon: '🏢', title: 'Storage & Warehouse', desc: 'Manage storage locations', path: '/storage', countKey: 'storage' },
  { icon: '✅', title: 'Compliance', desc: 'Provenance and regulatory checks', path: '/compliance', countKey: 'compliance' },
  { icon: '📊', title: 'Financial Reports', desc: 'Revenue and settlement reports', path: '/reports' },
  { icon: '✍️', title: 'AI: Lot Description', desc: 'Generate professional lot descriptions', path: '/ai/lot-description' },
  { icon: '💎', title: 'AI: Valuation', desc: 'AI-powered price estimates', path: '/ai/valuation' },
  { icon: '🔍', title: 'AI: Authenticity', desc: 'Verify item authenticity', path: '/ai/authenticity' },
  { icon: '📣', title: 'AI: Marketing', desc: 'Generate marketing materials', path: '/ai/marketing' },
  { icon: '🎯', title: 'AI: Buyer Matching', desc: 'Match items to potential buyers', path: '/ai/buyer-matching' },
  { icon: '📈', title: 'AI: Market Trends', desc: 'Analyze market trends and predictions', path: '/ai/market-trends' },
  { icon: '📸', title: 'Photography Studio', desc: 'Schedule photo sessions for items', path: '/photography', countKey: 'photography' },
  { icon: '📖', title: 'Catalog Production', desc: 'Manage auction catalog entries', path: '/catalog', countKey: 'catalog' },
  { icon: '📣', title: 'Marketing Campaigns', desc: 'Plan and track marketing efforts', path: '/campaigns', countKey: 'campaigns' },
  { icon: '💳', title: 'Payments', desc: 'Process and track payments', path: '/payments', countKey: 'payments' },
  { icon: '📦', title: 'Unsold Lots', desc: 'Manage unsold lot disposition', path: '/unsold-lots', countKey: 'unsoldLots' },
  { icon: '🔎', title: 'Appraisals', desc: 'Schedule and manage appraisals', path: '/appraisals', countKey: 'appraisals' },
  { icon: '🏠', title: 'Estate Sales', desc: 'Coordinate estate sale projects', path: '/estates', countKey: 'estates' },
];

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalItems: 0, activeAuctions: 0, registeredBidders: 0, totalRevenue: 0 });
  const [counts, setCounts] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [financial, consignors, items, auctions, bidders, bids, invoices, shipping, conditions, storage, compliance, photography, catalog, campaigns, payments, unsoldLots, appraisals, estates] = await Promise.allSettled([
          api.get('/reports/financial'),
          api.get('/consignors'),
          api.get('/items'),
          api.get('/auctions'),
          api.get('/bidders'),
          api.get('/live-auctions'),
          api.get('/invoices'),
          api.get('/shipping'),
          api.get('/conditions'),
          api.get('/storage'),
          api.get('/compliance'),
          api.get('/photography'),
          api.get('/catalog'),
          api.get('/campaigns'),
          api.get('/payments'),
          api.get('/unsold-lots'),
          api.get('/appraisals'),
          api.get('/estates'),
        ]);

        if (financial.status === 'fulfilled') {
          const f = financial.value.data;
          setStats({
            totalItems: f.items?.total_items || 0,
            activeAuctions: f.overview?.total_auctions || 0,
            registeredBidders: 0,
            totalRevenue: f.overview?.total_revenue || 0,
          });
        }

        if (bidders.status === 'fulfilled') {
          const bidderCount = Array.isArray(bidders.value.data) ? bidders.value.data.length : 0;
          setStats(prev => ({ ...prev, registeredBidders: bidderCount }));
        }

        const c = {};
        if (consignors.status === 'fulfilled') c.consignors = Array.isArray(consignors.value.data) ? consignors.value.data.length : 0;
        if (items.status === 'fulfilled') c.items = Array.isArray(items.value.data) ? items.value.data.length : 0;
        if (auctions.status === 'fulfilled') c.auctions = Array.isArray(auctions.value.data) ? auctions.value.data.length : 0;
        if (bidders.status === 'fulfilled') c.bidders = Array.isArray(bidders.value.data) ? bidders.value.data.length : 0;
        if (bids.status === 'fulfilled') c.bids = Array.isArray(bids.value.data) ? bids.value.data.length : 0;
        if (invoices.status === 'fulfilled') c.invoices = Array.isArray(invoices.value.data) ? invoices.value.data.length : 0;
        if (shipping.status === 'fulfilled') c.shipping = Array.isArray(shipping.value.data) ? shipping.value.data.length : 0;
        if (conditions.status === 'fulfilled') c.conditions = Array.isArray(conditions.value.data) ? conditions.value.data.length : 0;
        if (storage.status === 'fulfilled') c.storage = Array.isArray(storage.value.data) ? storage.value.data.length : 0;
        if (compliance.status === 'fulfilled') c.compliance = Array.isArray(compliance.value.data) ? compliance.value.data.length : 0;
        if (photography.status === 'fulfilled') c.photography = Array.isArray(photography.value.data) ? photography.value.data.length : 0;
        if (catalog.status === 'fulfilled') c.catalog = Array.isArray(catalog.value.data) ? catalog.value.data.length : 0;
        if (campaigns.status === 'fulfilled') c.campaigns = Array.isArray(campaigns.value.data) ? campaigns.value.data.length : 0;
        if (payments.status === 'fulfilled') c.payments = Array.isArray(payments.value.data) ? payments.value.data.length : 0;
        if (unsoldLots.status === 'fulfilled') c.unsoldLots = Array.isArray(unsoldLots.value.data) ? unsoldLots.value.data.length : 0;
        if (appraisals.status === 'fulfilled') c.appraisals = Array.isArray(appraisals.value.data) ? appraisals.value.data.length : 0;
        if (estates.status === 'fulfilled') c.estates = Array.isArray(estates.value.data) ? estates.value.data.length : 0;
        setCounts(c);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome to the AI Auction House Platform</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Items</div>
          <div className="stat-value">{stats.totalItems}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Auctions</div>
          <div className="stat-value">{stats.activeAuctions}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Registered Bidders</div>
          <div className="stat-value">{stats.registeredBidders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value gold">${Number(stats.totalRevenue).toLocaleString()}</div>
        </div>
      </div>

      <div className="dashboard-grid">
        {featureCards.map((card) => (
          <div key={card.path} className="feature-card" onClick={() => navigate(card.path)}>
            <div className="feature-card-icon">{card.icon}</div>
            <div className="feature-card-title">{card.title}</div>
            <div className="feature-card-description">{card.desc}</div>
            {card.countKey && counts[card.countKey] !== undefined && (
              <div className="feature-card-count">{counts[card.countKey]} records</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
