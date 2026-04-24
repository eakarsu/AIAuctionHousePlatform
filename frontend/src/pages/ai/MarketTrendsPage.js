import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

const categories = ['Fine Art', 'Jewelry', 'Antiques', 'Vehicles', 'Wine & Spirits', 'Watches', 'Furniture', 'Sculptures', 'Asian Art', 'Contemporary Art', 'Old Masters', 'Decorative Arts', 'Silver', 'Ceramics', 'Books & Manuscripts'];

function MarketTrendsPage() {
  const [category, setCategory] = useState('Fine Art');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      let soldItems = [];
      try {
        const itemsRes = await api.get('/items');
        soldItems = itemsRes.data
          .filter(i => i.status === 'sold' && i.category === category)
          .map(i => ({
            title: i.title,
            category: i.category,
            hammer_price: i.hammer_price,
            reserve_price: i.reserve_price,
            estimate_low: i.estimate_low,
            estimate_high: i.estimate_high,
          }));
      } catch (err) {
        console.log('Could not fetch items for context');
      }

      const payload = { category, recent_sales: soldItems };
      const res = await api.post('/ai/market-trends', payload);
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to analyze trends'); }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header"><div><h1 className="page-title">AI Market Trends</h1><p className="page-subtitle">Analyze market trends and predict future pricing patterns</p></div></div>
      <div className="ai-form">
        <h3 className="ai-form-title">Select Category for Analysis</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Category</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(201,168,76,0.08)', borderRadius: '8px', fontSize: '0.85rem', color: '#636e72' }}>
            The AI will analyze recent sales data and market conditions for {category} to provide trend insights and predictions.
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Analyzing trends...</span> : '📈 Analyze Market Trends'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title={`Market Trends: ${category}`} />}
    </div>
  );
}

export default MarketTrendsPage;
