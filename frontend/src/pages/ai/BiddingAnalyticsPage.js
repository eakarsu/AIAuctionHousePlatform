import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function BiddingAnalyticsPage() {
  const [form, setForm] = useState({
    lot_title: '',
    category: 'Fine Art',
    current_high_bid: '',
    estimate_low: '',
    estimate_high: '',
  });
  const [bidsText, setBidsText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const parseBids = () => {
    if (!bidsText.trim()) return [];
    return bidsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        // Format: timestamp|bidder|amount
        const [timestamp, bidder, amount] = line.split('|').map((s) => s && s.trim());
        return {
          timestamp: timestamp || new Date().toISOString(),
          bidder_id: bidder || 'anon',
          amount: amount ? Number(amount) : 0,
        };
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/ai/bidding-analytics', {
        ...form,
        current_high_bid: Number(form.current_high_bid) || 0,
        estimate_low: Number(form.estimate_low) || 0,
        estimate_high: Number(form.estimate_high) || 0,
        bids: parseBids(),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyse bids');
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Bidding Analytics</h1>
          <p className="page-subtitle">Bid velocity, predicted hammer, buyer concentration in real time</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Lot &amp; Live Bid State</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Lot Title</label>
            <input
              className="form-input"
              value={form.lot_title}
              onChange={(e) => setField('lot_title', e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input
                className="form-input"
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Current High Bid (USD)</label>
              <input
                type="number"
                className="form-input"
                value={form.current_high_bid}
                onChange={(e) => setField('current_high_bid', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Estimate Low</label>
              <input
                type="number"
                className="form-input"
                value={form.estimate_low}
                onChange={(e) => setField('estimate_low', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Estimate High</label>
              <input
                type="number"
                className="form-input"
                value={form.estimate_high}
                onChange={(e) => setField('estimate_high', e.target.value)}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Bid Log (one per line: timestamp|bidder|amount)</label>
            <textarea
              className="form-textarea"
              value={bidsText}
              onChange={(e) => setBidsText(e.target.value)}
              placeholder={'2025-05-02T14:00:00Z|B-001|1000\n2025-05-02T14:00:14Z|B-014|1100\n2025-05-02T14:00:29Z|B-001|1200'}
              rows={6}
            />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Analysing...</span> : 'Analyse Bidding'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Live Bidding Insights" />}
    </div>
  );
}

export default BiddingAnalyticsPage;
