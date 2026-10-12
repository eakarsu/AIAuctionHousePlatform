
import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function InsuranceValuationPage() {
  const fullAIExamples = useFullAIExamples();

  const [form, setForm] = useState({
    title: '',
    category: 'Fine Art',
    description: '',
    condition: '',
    auction_estimate_high: '',
    owner_use: 'private collection display',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/ai/insurance-valuation', {
        ...form,
        auction_estimate_high: form.auction_estimate_high
          ? Number(form.auction_estimate_high) : null,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Insurance valuation failed');
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Insurance Valuation</h1>
          <p className="page-subtitle">Insurable replacement value, premium estimate, coverage conditions</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Item Details</h3>
        <form onSubmit={handleSubmit} data-full-ai-workspace="InsuranceValuationPage"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={form.title}
                onChange={(e) => setField('title', e.target.value)} required data-full-ai-field={fullAIExamples.bind({ current: form.title, change: (e) => setField('title', e.target.value), label: "form.title", manual: false, json: false, sample: '' }, "p1-1617", undefined)} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input className="form-input" value={form.category}
                onChange={(e) => setField('category', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.category, change: (e) => setField('category', e.target.value), label: "form.category", manual: false, json: false, sample: 'Fine Art' }, "p1-1858", undefined)} />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-textarea" rows={4}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.description, change: (e) => setField('description', e.target.value), label: "form.description", manual: false, json: false, sample: '' }, "p1-2110", undefined)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Condition</label>
              <input className="form-input" value={form.condition}
                onChange={(e) => setField('condition', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.condition, change: (e) => setField('condition', e.target.value), label: "form.condition", manual: false, json: false, sample: '' }, "p1-2417", undefined)} />
            </div>
            <div className="form-group">
              <label>Auction Estimate High (USD)</label>
              <input type="number" className="form-input" value={form.auction_estimate_high}
                onChange={(e) => setField('auction_estimate_high', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.auction_estimate_high, change: (e) => setField('auction_estimate_high', e.target.value), label: "form.auction_estimate_high", manual: false, json: false, sample: '' }, "p1-2676", undefined)} />
            </div>
            <div className="form-group">
              <label>Owner Use</label>
              <select className="form-select" value={form.owner_use}
                onChange={(e) => setField('owner_use', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.owner_use, change: (e) => setField('owner_use', e.target.value), label: "form.owner_use", manual: false, json: false, sample: 'private collection display' }, "p1-2955", undefined)}>
                <option>private collection display</option>
                <option>storage / vault</option>
                <option>museum loan</option>
                <option>commercial display</option>
                <option>traveling exhibition</option>
              </select>
            </div>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? 'Valuing...' : 'Generate Insurance Valuation'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Insurance Valuation" />}
    </div>
  );
}

export default InsuranceValuationPage;
