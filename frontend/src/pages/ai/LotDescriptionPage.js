import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function LotDescriptionPage() {
  const [form, setForm] = useState({ title: '', category: 'Fine Art', medium: '', dimensions: '', condition: 'Good', notes: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post('/ai/lot-description', form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate description');
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header"><div><h1 className="page-title">AI Lot Description</h1><p className="page-subtitle">Generate professional auction lot descriptions</p></div></div>
      <div className="ai-form">
        <h3 className="ai-form-title">Item Details</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Title</label><input className="form-input" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g., Impressionist Landscape by Claude Monet" required /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setField('category', e.target.value)}>
              {['Fine Art', 'Jewelry', 'Antiques', 'Vehicles', 'Wine & Spirits', 'Watches', 'Furniture', 'Sculptures', 'Asian Art', 'Contemporary Art', 'Old Masters', 'Decorative Arts', 'Silver', 'Ceramics', 'Books & Manuscripts'].map(c => <option key={c}>{c}</option>)}
            </select></div>
            <div className="form-group"><label>Medium</label><input className="form-input" value={form.medium} onChange={e => setField('medium', e.target.value)} placeholder="e.g., Oil on canvas" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Dimensions</label><input className="form-input" value={form.dimensions} onChange={e => setField('dimensions', e.target.value)} placeholder="e.g., 24 x 36 inches" /></div>
            <div className="form-group"><label>Condition</label><select className="form-select" value={form.condition} onChange={e => setField('condition', e.target.value)}><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option></select></div>
          </div>
          <div className="form-group"><label>Additional Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any additional details about the item..." /></div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Generating...</span> : '✨ Generate Description'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Generated Lot Description" />}
    </div>
  );
}

export default LotDescriptionPage;
