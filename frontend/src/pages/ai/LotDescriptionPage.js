
import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function LotDescriptionPage() {
  const fullAIExamples = useFullAIExamples();

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
        <form onSubmit={handleSubmit} data-full-ai-workspace="LotDescriptionPage"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
          <div className="form-group"><label>Title</label><input className="form-input" value={form.title} onChange={e => setField('title', e.target.value)} placeholder="e.g., Impressionist Landscape by Claude Monet" required data-full-ai-field={fullAIExamples.bind({ current: form.title, change: e => setField('title', e.target.value), label: "form.title", manual: false, json: false, sample: '' }, "p1-1268", undefined)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setField('category', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.category, change: e => setField('category', e.target.value), label: "form.category", manual: false, json: false, sample: 'Fine Art' }, "p1-1545", undefined)}>
              {['Fine Art', 'Jewelry', 'Antiques', 'Vehicles', 'Wine & Spirits', 'Watches', 'Furniture', 'Sculptures', 'Asian Art', 'Contemporary Art', 'Old Masters', 'Decorative Arts', 'Silver', 'Ceramics', 'Books & Manuscripts'].map(c => <option key={c}>{c}</option>)}
            </select></div>
            <div className="form-group"><label>Medium</label><input className="form-input" value={form.medium} onChange={e => setField('medium', e.target.value)} placeholder="e.g., Oil on canvas" data-full-ai-field={fullAIExamples.bind({ current: form.medium, change: e => setField('medium', e.target.value), label: "form.medium", manual: false, json: false, sample: '' }, "p1-2013", undefined)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Dimensions</label><input className="form-input" value={form.dimensions} onChange={e => setField('dimensions', e.target.value)} placeholder="e.g., 24 x 36 inches" data-full-ai-field={fullAIExamples.bind({ current: form.dimensions, change: e => setField('dimensions', e.target.value), label: "form.dimensions", manual: false, json: false, sample: '' }, "p1-2276", undefined)} /></div>
            <div className="form-group"><label>Condition</label><select className="form-select" value={form.condition} onChange={e => setField('condition', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.condition, change: e => setField('condition', e.target.value), label: "form.condition", manual: false, json: false, sample: 'Good' }, "p1-2493", undefined)}><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option></select></div>
          </div>
          <div className="form-group"><label>Additional Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Any additional details about the item..." data-full-ai-field={fullAIExamples.bind({ current: form.notes, change: e => setField('notes', e.target.value), label: "form.notes", manual: false, json: false, sample: '' }, "p1-2793", undefined)} /></div>
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
