import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function ValuationPage() {
  const [form, setForm] = useState({ title: '', category: 'Fine Art', description: '', condition: 'Good', medium: '', dimensions: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/valuation', form);
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to generate valuation'); }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header"><div><h1 className="page-title">AI Valuation</h1><p className="page-subtitle">AI-powered price estimation and market analysis</p></div></div>
      <div className="ai-form">
        <h3 className="ai-form-title">Item Details for Valuation</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Title</label><input className="form-input" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g., Art Deco Diamond Ring" required /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setField('category', e.target.value)}>
              {['Fine Art', 'Jewelry', 'Antiques', 'Vehicles', 'Wine & Spirits', 'Watches', 'Furniture', 'Sculptures', 'Asian Art', 'Contemporary Art', 'Old Masters', 'Decorative Arts', 'Silver', 'Ceramics', 'Books & Manuscripts'].map(c => <option key={c}>{c}</option>)}
            </select></div>
            <div className="form-group"><label>Condition</label><select className="form-select" value={form.condition} onChange={e => setField('condition', e.target.value)}><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Medium</label><input className="form-input" value={form.medium} onChange={e => setField('medium', e.target.value)} placeholder="e.g., Platinum, diamonds" /></div>
            <div className="form-group"><label>Dimensions</label><input className="form-input" value={form.dimensions} onChange={e => setField('dimensions', e.target.value)} placeholder="e.g., Ring size 7" /></div>
          </div>
          <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Detailed description of the item including provenance, history, notable features..." /></div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Analyzing...</span> : '💎 Generate Valuation'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="AI Valuation Report" />}
    </div>
  );
}

export default ValuationPage;
