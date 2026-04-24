import React, { useState, useEffect } from 'react';
import api from '../api';

function ReportsPage() {
  const [financial, setFinancial] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fin, set] = await Promise.allSettled([
          api.get('/reports/financial'),
          api.get('/reports/consignor-settlements'),
        ]);
        if (fin.status === 'fulfilled') setFinancial(fin.value.data);
        if (set.status === 'fulfilled') setSettlements(Array.isArray(set.value.data) ? set.value.data : []);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchData();
  }, []);

  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '$0';

  if (loading) return <div className="loading-spinner-lg">Loading reports...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Financial Reports</h1><p className="page-subtitle">Revenue analytics and consignor settlements</p></div></div>

      {financial && (
        <div className="reports-stats">
          <div className="report-stat-card"><div className="stat-icon">💰</div><div className="stat-label">Total Revenue</div><div className="stat-value gold">{fmt(financial.overview?.total_revenue)}</div></div>
          <div className="report-stat-card"><div className="stat-icon">🔨</div><div className="stat-label">Avg Hammer Price</div><div className="stat-value">{fmt(financial.items?.average_hammer_price)}</div></div>
          <div className="report-stat-card"><div className="stat-icon">📊</div><div className="stat-label">Sell-Through Rate</div><div className="stat-value">{financial.overview?.sell_through_rate || 0}%</div></div>
          <div className="report-stat-card"><div className="stat-icon">🖼️</div><div className="stat-label">Total Items</div><div className="stat-value">{financial.items?.total_items || 0}</div></div>
          <div className="report-stat-card"><div className="stat-icon">✅</div><div className="stat-label">Items Sold</div><div className="stat-value">{financial.items?.items_sold || 0}</div></div>
          <div className="report-stat-card"><div className="stat-icon">📅</div><div className="stat-label">Total Auctions</div><div className="stat-value">{financial.overview?.total_auctions || 0}</div></div>
        </div>
      )}

      <h2 style={{ marginBottom: '16px', fontSize: '1.3rem', color: '#1a1a2e' }}>Consignor Settlements</h2>
      <div className="table-container">
        <table className="data-table">
          <thead><tr className="table-header">
            <th>Consignor</th><th>Items Consigned</th><th>Items Sold</th><th>Total Revenue</th><th>Commission</th><th>Settlement</th>
          </tr></thead>
          <tbody>
            {settlements.length === 0 ? (
              <tr><td colSpan="6" className="table-empty">No settlement data available</td></tr>
            ) : settlements.map((s, i) => (
              <tr key={i} className="table-row">
                <td><strong>{s.name || `Consignor #${s.id || i + 1}`}</strong></td>
                <td>{s.total_items || 0}</td>
                <td>{s.items_sold || 0}</td>
                <td>{fmt(s.total_sales)}</td>
                <td>{fmt(s.commission_earned)}</td>
                <td><strong>{fmt(s.amount_due_to_consignor)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportsPage;
