
import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function InsurancePolicyRecommendationPage() {
  const fullAIExamples = useFullAIExamples();

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
        <form onSubmit={handleSubmit} data-full-ai-workspace="InsurancePolicyRecommendationPage"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
          <div className="form-group">
            <label>Title</label>
            <input className="form-input" value={form.title} onChange={(e) => setField('title', e.target.value)} required data-full-ai-field={fullAIExamples.bind({ current: form.title, change: (e) => setField('title', e.target.value), label: "form.title", manual: false, json: false, sample: '' }, "p1-1791", undefined)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input className="form-input" value={form.category} onChange={(e) => setField('category', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.category, change: (e) => setField('category', e.target.value), label: "form.category", manual: false, json: false, sample: 'Fine Art' }, "p1-2051", undefined)} />
            </div>
            <div className="form-group">
              <label>Appraised Value (USD)</label>
              <input type="number" className="form-input" value={form.appraised_value} onChange={(e) => setField('appraised_value', e.target.value)} required data-full-ai-field={fullAIExamples.bind({ current: form.appraised_value, change: (e) => setField('appraised_value', e.target.value), label: "form.appraised_value", manual: false, json: false, sample: '' }, "p1-2286", undefined)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>
                <input type="checkbox" checked={form.transit_required} onChange={(e) => setField('transit_required', e.target.checked)} data-full-ai-field={fullAIExamples.bind({ current: form.transit_required, change: (e) => setField('transit_required', e.target.checked), label: "form.transit_required", manual: false, json: false, sample: false }, "p1-2585", undefined)} /> Transit required
              </label>
            </div>
            <div className="form-group">
              <label>Storage Location</label>
              <input className="form-input" value={form.storage_location} onChange={(e) => setField('storage_location', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.storage_location, change: (e) => setField('storage_location', e.target.value), label: "form.storage_location", manual: false, json: false, sample: '' }, "p1-2868", undefined)} />
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
