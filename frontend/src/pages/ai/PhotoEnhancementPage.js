
import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function PhotoEnhancementPage() {
  const fullAIExamples = useFullAIExamples();

  const [form, setForm] = useState({
    title: '',
    category: 'Fine Art',
    num_photos: 4,
    current_photo_notes: '',
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
      const res = await api.post('/ai/photo-enhancement-plan', {
        ...form,
        num_photos: Number(form.num_photos) || 0,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Enhancement plan failed');
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Photo Enhancement Plan</h1>
          <p className="page-subtitle">Step-by-step photography enhancement to catalog standard</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Lot Photography Brief</h3>
        <form onSubmit={handleSubmit} data-full-ai-workspace="PhotoEnhancementPage"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={form.title}
                onChange={(e) => setField('title', e.target.value)} required data-full-ai-field={fullAIExamples.bind({ current: form.title, change: (e) => setField('title', e.target.value), label: "form.title", manual: false, json: false, sample: '' }, "p1-1486", undefined)} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input className="form-input" value={form.category}
                onChange={(e) => setField('category', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.category, change: (e) => setField('category', e.target.value), label: "form.category", manual: false, json: false, sample: 'Fine Art' }, "p1-1727", undefined)} />
            </div>
            <div className="form-group">
              <label># Existing Photos</label>
              <input type="number" min={0} className="form-input" value={form.num_photos}
                onChange={(e) => setField('num_photos', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.num_photos, change: (e) => setField('num_photos', e.target.value), label: "form.num_photos", manual: false, json: false, sample: 4 }, "p1-1974", undefined)} />
            </div>
          </div>
          <div className="form-group">
            <label>Notes about current photos</label>
            <textarea className="form-textarea" rows={5}
              value={form.current_photo_notes}
              onChange={(e) => setField('current_photo_notes', e.target.value)}
              placeholder="e.g. Photo 1 has yellow cast, photo 2 is back-lit, no detail shot of signature, color of red is too saturated..." data-full-ai-field={fullAIExamples.bind({ current: form.current_photo_notes, change: (e) => setField('current_photo_notes', e.target.value), label: "form.current_photo_notes", manual: false, json: false, sample: '' }, "p1-2267", undefined)} />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? 'Planning...' : 'Generate Enhancement Plan'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Photo Enhancement Plan" />}
    </div>
  );
}

export default PhotoEnhancementPage;
