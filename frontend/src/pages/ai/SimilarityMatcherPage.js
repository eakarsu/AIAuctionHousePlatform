import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function SimilarityMatcherPage() {
  const [form, setForm] = useState({
    title: '',
    category: 'Fine Art',
    description: '',
    medium: '',
    dimensions: '',
  });
  const [pastLotsText, setPastLotsText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const parsePastLots = () => {
    if (!pastLotsText.trim()) return [];
    return pastLotsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Format: title|hammer|estLow|estHigh|category
        const [title, hammer, estLow, estHigh, category] = line.split('|').map((s) => s && s.trim());
        return {
          title: title || 'Untitled',
          hammer_price: hammer ? Number(hammer) : null,
          estimate_low: estLow ? Number(estLow) : null,
          estimate_high: estHigh ? Number(estHigh) : null,
          category: category || form.category,
        };
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/ai/similarity-matcher', {
        ...form,
        past_lots: parsePastLots(),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to find similar lots');
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lot Similarity Matcher</h1>
          <p className="page-subtitle">Suggest reserve and estimate ranges from comparable past lots</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Incoming Item</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input
              className="form-input"
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="e.g., Bronze Tang Dynasty Horse"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              >
                {[
                  'Fine Art', 'Jewelry', 'Antiques', 'Vehicles', 'Wine & Spirits',
                  'Watches', 'Furniture', 'Sculptures', 'Asian Art',
                  'Contemporary Art', 'Old Masters', 'Decorative Arts',
                  'Silver', 'Ceramics', 'Books & Manuscripts',
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Medium</label>
              <input
                className="form-input"
                value={form.medium}
                onChange={(e) => setField('medium', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Dimensions</label>
              <input
                className="form-input"
                value={form.dimensions}
                onChange={(e) => setField('dimensions', e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Describe condition, provenance, and any distinguishing features..."
            />
          </div>
          <div className="form-group">
            <label>Past Lots (one per line: title|hammer|estLow|estHigh|category)</label>
            <textarea
              className="form-textarea"
              value={pastLotsText}
              onChange={(e) => setPastLotsText(e.target.value)}
              placeholder={'Bronze Han Dynasty Horse|18000|12000|18000|Asian Art\nTang Dynasty Earthenware Horse|9500|8000|12000|Asian Art'}
              rows={5}
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Matching...</span> : 'Find Comparables'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Similarity & Reserve Recommendation" />}
    </div>
  );
}

export default SimilarityMatcherPage;
