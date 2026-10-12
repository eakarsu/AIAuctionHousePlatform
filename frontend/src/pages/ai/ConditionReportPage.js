
import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function ConditionReportPage() {
  const fullAIExamples = useFullAIExamples();

  const [form, setForm] = useState({
    title: '',
    category: 'Fine Art',
    medium: '',
    dimensions: '',
    observed_condition: '',
    photo_notes: '',
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
      const res = await api.post('/ai/condition-report-pdf-data', form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Condition report failed');
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Condition Report Generator</h1>
          <p className="page-subtitle">Structured condition report data ready for PDF rendering</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Inspected Item</h3>
        <form onSubmit={handleSubmit} data-full-ai-workspace="ConditionReportPage"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={form.title}
                onChange={(e) => setField('title', e.target.value)} required data-full-ai-field={fullAIExamples.bind({ current: form.title, change: (e) => setField('title', e.target.value), label: "form.title", manual: false, json: false, sample: '' }, "p1-1450", undefined)} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input className="form-input" value={form.category}
                onChange={(e) => setField('category', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.category, change: (e) => setField('category', e.target.value), label: "form.category", manual: false, json: false, sample: 'Fine Art' }, "p1-1691", undefined)} />
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input className="form-input" value={form.medium}
                onChange={(e) => setField('medium', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.medium, change: (e) => setField('medium', e.target.value), label: "form.medium", manual: false, json: false, sample: '' }, "p1-1927", undefined)} />
            </div>
            <div className="form-group">
              <label>Dimensions</label>
              <input className="form-input" value={form.dimensions}
                onChange={(e) => setField('dimensions', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.dimensions, change: (e) => setField('dimensions', e.target.value), label: "form.dimensions", manual: false, json: false, sample: '' }, "p1-2163", undefined)} />
            </div>
          </div>
          <div className="form-group">
            <label>Observed Condition Notes</label>
            <textarea className="form-textarea" rows={5}
              value={form.observed_condition}
              onChange={(e) => setField('observed_condition', e.target.value)}
              placeholder="Surface condition, restoration history, structural integrity, fading, craquelure, foxing..."
              required data-full-ai-field={fullAIExamples.bind({ current: form.observed_condition, change: (e) => setField('observed_condition', e.target.value), label: "form.observed_condition", manual: false, json: false, sample: '' }, "p1-2432", undefined)} />
          </div>
          <div className="form-group">
            <label>Photographic Evidence Notes</label>
            <textarea className="form-textarea" rows={3}
              value={form.photo_notes}
              onChange={(e) => setField('photo_notes', e.target.value)}
              placeholder="Photo 1: front under raking light. Photo 2: detail of UR corner..." data-full-ai-field={fullAIExamples.bind({ current: form.photo_notes, change: (e) => setField('photo_notes', e.target.value), label: "form.photo_notes", manual: false, json: false, sample: '' }, "p1-2871", undefined)} />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report Data'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Condition Report (PDF-ready)" />}
    </div>
  );
}

export default ConditionReportPage;
