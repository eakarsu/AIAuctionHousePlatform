import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const navSections = [
  {
    title: 'MANAGEMENT',
    items: [
      { to: '/consignors', icon: '🤝', label: 'Consignors' },
      { to: '/items', icon: '🖼️', label: 'Items' },
      { to: '/auctions', icon: '📅', label: 'Auctions' },
      { to: '/bidders', icon: '🙋', label: 'Bidders' },
    ],
  },
  {
    title: 'OPERATIONS',
    items: [
      { to: '/live-auctions', icon: '🔨', label: 'Live Auctions' },
      { to: '/invoices', icon: '💰', label: 'Invoices' },
      { to: '/shipping', icon: '🚚', label: 'Shipping' },
      { to: '/storage', icon: '🏢', label: 'Storage' },
      { to: '/photography', icon: '📸', label: 'Photography' },
      { to: '/catalog', icon: '📖', label: 'Catalog' },
      { to: '/campaigns', icon: '📣', label: 'Campaigns' },
      { to: '/payments', icon: '💳', label: 'Payments' },
    ],
  },
  {
    title: 'QUALITY',
    items: [
      { to: '/conditions', icon: '📋', label: 'Conditions' },
      { to: '/compliance', icon: '✅', label: 'Compliance' },
    ],
  },
  {
    title: 'SALES',
    items: [
      { to: '/unsold-lots', icon: '📦', label: 'Unsold Lots' },
      { to: '/appraisals', icon: '🔎', label: 'Appraisals' },
      { to: '/estates', icon: '🏠', label: 'Estate Sales' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { to: '/reports', icon: '📊', label: 'Reports' },
    ],
  },
  {
    title: 'AI TOOLS',
    items: [
      { to: '/ai/lot-description', icon: '✍️', label: 'Lot Description' },
      { to: '/ai/valuation', icon: '💎', label: 'Valuation' },
      { to: '/ai/authenticity', icon: '🔍', label: 'Authenticity' },
      { to: '/ai/marketing', icon: '📣', label: 'Marketing' },
      { to: '/ai/buyer-matching', icon: '🎯', label: 'Buyer Matching' },
      { to: '/ai/market-trends', icon: '📈', label: 'Market Trends' },
      { to: '/ai/similarity-matcher', icon: '🔗', label: 'Similarity Matcher' },
      { to: '/ai/bidding-analytics', icon: '⚡', label: 'Bidding Analytics' },
      { to: '/ai/provenance-verification', icon: '🛡️', label: 'Provenance Check' },
      { to: '/ai/multi-language-catalog', icon: '🌐', label: 'Translate Catalog' },
      { to: '/ai/condition-report', icon: '📝', label: 'Condition Report' },
      { to: '/ai/buyer-preference', icon: '🧠', label: 'Buyer Preferences' },
      { to: '/ai/insurance-valuation', icon: '🛟', label: 'Insurance Value' },
      { to: '/ai/photo-enhancement', icon: '🎨', label: 'Photo Enhancement' },
    ],
  },
];

function Layout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
          <h1>AUCTION HOUSE</h1>
          <div className="logo-subtitle">AI-Powered Platform</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              <span className="nav-item-icon">🏠</span>
              Dashboard
            </NavLink>
          </div>
          {navSections.map((section) => (
            <div className="nav-section" key={section.title}>
              <div className="nav-section-title">{section.title}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-item-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;
