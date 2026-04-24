import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function AuthenticityPage() {
  const [form, setForm] = useState({ title: '', category: 'Fine Art', description: '', provenance: '', medium: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/authenticity', form);
      setResult(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to verify authenticity'); }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header"><div><h1 className="page-title">AI Authenticity Verification</h1><p className="page-subtitle">AI-powered authenticity analysis and red flag detection</p></div></div>
      <div className="ai-form">
        <h3 className="ai-form-title">Item Details for Verification</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Title</label><input className="form-input" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g., Attributed to Rembrandt van Rijn" required /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setField('category', e.target.value)}>
              {['Fine Art', 'Jewelry', 'Antiques', 'Vehicles', 'Wine & Spirits', 'Watches', 'Furniture', 'Sculptures', 'Asian Art', 'Contemporary Art', 'Old Masters', 'Decorative Arts', 'Silver', 'Ceramics', 'Books & Manuscripts'].map(c => <option key={c}>{c}</option>)}
            </select></div>
            <div className="form-group"><label>Medium</label><input className="form-input" value={form.medium} onChange={e => setField('medium', e.target.value)} placeholder="e.g., Oil on panel" /></div>
          </div>
          <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Describe the item in detail including any signatures, marks, labels..." /></div>
          <div className="form-group"><label>Provenance</label><textarea className="form-textarea" value={form.provenance} onChange={e => setField('provenance', e.target.value)} placeholder="Known ownership history, exhibition records, publications..." /></div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Verifying...</span> : '🔍 Verify Authenticity'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Authenticity Analysis" />}
    </div>
  );
}

export default AuthenticityPage;
