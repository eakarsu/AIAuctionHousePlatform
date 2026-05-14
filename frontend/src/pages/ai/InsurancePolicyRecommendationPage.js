import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function InsurancePolicyRecommendationPage() {
  const [form, setForm] = useState({
    title: '',
    category: 'Fine Art',
    appraised_value: '',
    transit_required: false,
    storage_location: '',
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
      const res = await api.post('/ai/insurance-policy-recommendation', {
        ...form,
        appraised_value: Number(form.appraised_value) || 0,
      });
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.status === 503) {
        const missing = err.response.data && err.response.data.missing;
        setError(`Insurance integration unavailable. Set ${missing || 'INSURANCE_API_KEY'} on the server.`);
      } else {
        setError(err.response?.data?.error || 'Failed to recommend insurance policy');
      }
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Insurance Policy Recommendation</h1>
          <p className="page-subtitle">Carrier-agnostic policy structure — gated by INSURANCE_API_KEY</p>
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
              <label>Appraised Value (USD)</label>
              <input type="number" className="form-input" value={form.appraised_value} onChange={(e) => setField('appraised_value', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>
                <input type="checkbox" checked={form.transit_required} onChange={(e) => setField('transit_required', e.target.checked)} /> Transit required
              </label>
            </div>
            <div className="form-group">
              <label>Storage Location</label>
              <input className="form-input" value={form.storage_location} onChange={(e) => setField('storage_location', e.target.value)} />
            </div>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Quoting...</span> : 'Recommend Policy'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Insurance Recommendation" />}
    </div>
  );
}

export default InsurancePolicyRecommendationPage;
