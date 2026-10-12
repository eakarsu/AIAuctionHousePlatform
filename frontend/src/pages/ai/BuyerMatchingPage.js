
import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState, useEffect } from 'react';
import api, { listRows } from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function BuyerMatchingPage() {
  const fullAIExamples = useFullAIExamples();

  const [form, setForm] = useState({ title: '', category: 'Fine Art', estimate_low: '', estimate_high: '' });
  const [bidders, setBidders] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBidders = async () => {
      try { const res = await api.get('/bidders'); setBidders(listRows(res.data)); } catch (err) { console.error(err); }
    };
    fetchBidders();
  }, []);

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const payload = {
        ...form,
        bidders: bidders.map(b => ({
          id: b.id,
          name: b.name,
          preferred_categories: b.preferred_categories,
          bidding_limit: b.bidding_limit,
          total_purchases: b.total_purchases,
          verification_status: b.verification_status,
        })),
      };
      const res = await api.post('/ai/buyer-matching', payload);
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to match buyers'); }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header"><div><h1 className="page-title">AI Buyer Matching</h1><p className="page-subtitle">Match items to potential buyers based on preferences and history</p></div></div>
      <div className="ai-form">
        <h3 className="ai-form-title">Item Details</h3>
        <form onSubmit={handleSubmit} data-full-ai-workspace="BuyerMatchingPage"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
          <div className="form-group"><label>Title</label><input className="form-input" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g., Banksy Original Print" required data-full-ai-field={fullAIExamples.bind({ current: form.title, change: e => setField('title', e.target.value), label: "form.title", manual: false, json: false, sample: '' }, "p1-1854", undefined)} /></div>
          <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setField('category', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.category, change: e => setField('category', e.target.value), label: "form.category", manual: false, json: false, sample: 'Fine Art' }, "p1-2074", undefined)}>
            {['Fine Art', 'Jewelry', 'Antiques', 'Vehicles', 'Wine & Spirits', 'Watches', 'Furniture', 'Sculptures', 'Asian Art', 'Contemporary Art', 'Old Masters', 'Decorative Arts', 'Silver', 'Ceramics', 'Books & Manuscripts'].map(c => <option key={c}>{c}</option>)}
          </select></div>
          <div className="form-row">
            <div className="form-group"><label>Estimate Low ($)</label><input type="number" className="form-input" value={form.estimate_low} onChange={e => setField('estimate_low', e.target.value)} placeholder="e.g., 10000" data-full-ai-field={fullAIExamples.bind({ current: form.estimate_low, change: e => setField('estimate_low', e.target.value), label: "form.estimate_low", manual: false, json: false, sample: '' }, "p1-2585", undefined)} /></div>
            <div className="form-group"><label>Estimate High ($)</label><input type="number" className="form-input" value={form.estimate_high} onChange={e => setField('estimate_high', e.target.value)} placeholder="e.g., 25000" data-full-ai-field={fullAIExamples.bind({ current: form.estimate_high, change: e => setField('estimate_high', e.target.value), label: "form.estimate_high", manual: false, json: false, sample: '' }, "p1-2819", undefined)} /></div>
          </div>
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: 'rgba(201,168,76,0.08)', borderRadius: '8px', fontSize: '0.85rem', color: '#636e72' }}>
            {bidders.length} registered bidders will be analyzed for matching
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Matching...</span> : '🎯 Find Matching Buyers'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Buyer Matching Results" />}
    </div>
  );
}

export default BuyerMatchingPage;
