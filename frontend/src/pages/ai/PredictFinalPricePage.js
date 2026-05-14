import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function PredictFinalPricePage() {
  const [form, setForm] = useState({
    title: '',
    category: 'Fine Art',
    estimate_low: '',
    estimate_high: '',
    condition: 'Good',
    provenance_notes: '',
    marketing_reach: '',
    prebid_count: '',
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
      const payload = {
        ...form,
        estimate_low: Number(form.estimate_low) || 0,
        estimate_high: Number(form.estimate_high) || 0,
        marketing_reach: Number(form.marketing_reach) || 0,
        prebid_count: Number(form.prebid_count) || 0,
      };
      const res = await api.post('/ai/predict-final-price', payload);
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.status === 503) {
        setError('AI service unavailable. The OPENROUTER_API_KEY is not configured on the server.');
      } else {
        setError(err.response?.data?.error || 'Failed to predict final price');
      }
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Predicted Final Price</h1>
          <p className="page-subtitle">Hammer + buyer's premium (25% under $1M, 20% above)</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Lot details</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setField('title', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input className="form-input" value={form.category} onChange={(e) => setField('category', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Condition</label>
              <select className="form-select" value={form.condition} onChange={(e) => setField('condition', e.target.value)}>
                <option>Excellent</option>
                <option>Good</option>
                <option>Fair</option>
                <option>Poor</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Estimate Low (USD)</label>
              <input type="number" className="form-input" value={form.estimate_low} onChange={(e) => setField('estimate_low', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Estimate High (USD)</label>
              <input type="number" className="form-input" value={form.estimate_high} onChange={(e) => setField('estimate_high', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Marketing Reach (impressions)</label>
              <input type="number" className="form-input" value={form.marketing_reach} onChange={(e) => setField('marketing_reach', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Pre-bid Count</label>
              <input type="number" className="form-input" value={form.prebid_count} onChange={(e) => setField('prebid_count', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Provenance Notes</label>
            <textarea className="form-textarea" value={form.provenance_notes} onChange={(e) => setField('provenance_notes', e.target.value)} />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Computing...</span> : 'Predict Final Price'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Predicted Final Price" />}
    </div>
  );
}

export default PredictFinalPricePage;
