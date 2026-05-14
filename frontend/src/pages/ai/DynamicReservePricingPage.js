import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function DynamicReservePricingPage() {
  const [form, setForm] = useState({
    title: '',
    category: 'Fine Art',
    estimate_low: '',
    estimate_high: '',
    condition: 'Good',
    consignor_min: '',
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
        consignor_min: Number(form.consignor_min) || 0,
      };
      const res = await api.post('/ai/dynamic-reserve-pricing', payload);
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.status === 503) {
        setError('AI service unavailable. The OPENROUTER_API_KEY is not configured on the server.');
      } else {
        setError(err.response?.data?.error || 'Failed to compute dynamic reserve');
      }
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Dynamic Reserve Pricing</h1>
          <p className="page-subtitle">Reserve recommendations enforced against a 70%-of-low / consignor-minimum policy floor</p>
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
            <div className="form-group">
              <label>Consignor Minimum (USD)</label>
              <input type="number" className="form-input" value={form.consignor_min} onChange={(e) => setField('consignor_min', e.target.value)} />
            </div>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Analyzing...</span> : 'Recommend Reserve'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Dynamic Reserve Recommendation" />}
    </div>
  );
}

export default DynamicReservePricingPage;
