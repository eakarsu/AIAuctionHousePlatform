import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function MarketingPage() {
  const [form, setForm] = useState({ title: '', category: 'Fine Art', description: '', estimate_low: '', estimate_high: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/marketing', form);
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to generate marketing materials'); }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header"><div><h1 className="page-title">AI Marketing Generator</h1><p className="page-subtitle">Generate catalog entries, marketing copy, and social media content</p></div></div>
      <div className="ai-form">
        <h3 className="ai-form-title">Item Details for Marketing</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Title</label><input className="form-input" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g., Rare Ming Dynasty Vase" required /></div>
          <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setField('category', e.target.value)}>
            {['Fine Art', 'Jewelry', 'Antiques', 'Vehicles', 'Wine & Spirits', 'Watches', 'Furniture', 'Sculptures', 'Asian Art', 'Contemporary Art', 'Old Masters', 'Decorative Arts', 'Silver', 'Ceramics', 'Books & Manuscripts'].map(c => <option key={c}>{c}</option>)}
          </select></div>
          <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Describe the item and its key selling points..." /></div>
          <div className="form-row">
            <div className="form-group"><label>Estimate Low ($)</label><input type="number" className="form-input" value={form.estimate_low} onChange={e => setField('estimate_low', e.target.value)} placeholder="e.g., 50000" /></div>
            <div className="form-group"><label>Estimate High ($)</label><input type="number" className="form-input" value={form.estimate_high} onChange={e => setField('estimate_high', e.target.value)} placeholder="e.g., 80000" /></div>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Generating...</span> : '📣 Generate Marketing Materials'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Marketing Materials" />}
    </div>
  );
}

export default MarketingPage;
