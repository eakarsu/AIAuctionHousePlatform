import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function ShillBiddingDetectionPage() {
  const sample = JSON.stringify(
    [
      { bidder_id: 'A1', amount: 1000, timestamp: '2026-01-01T10:00:00Z' },
      { bidder_id: 'A2', amount: 1100, timestamp: '2026-01-01T10:00:05Z' },
      { bidder_id: 'A1', amount: 1200, timestamp: '2026-01-01T10:00:08Z' },
      { bidder_id: 'A2', amount: 1300, timestamp: '2026-01-01T10:00:11Z' },
      { bidder_id: 'A1', amount: 1400, timestamp: '2026-01-01T10:00:14Z' },
    ],
    null,
    2
  );
  const [form, setForm] = useState({ auction_id: '', lot_id: '', bidsJson: sample });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    let bids = [];
    try {
      bids = JSON.parse(form.bidsJson);
    } catch (parseErr) {
      setError('Bids JSON is not valid JSON.');
      setLoading(false);
      return;
    }
    try {
      const res = await api.post('/ai/shill-bidding-detection', {
        auction_id: form.auction_id || null,
        lot_id: form.lot_id || null,
        bids,
      });
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.status === 503) {
        setError('AI service unavailable. The OPENROUTER_API_KEY is not configured on the server.');
      } else {
        setError(err.response?.data?.error || 'Failed to run shill detection');
      }
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Shill Bidding Detection</h1>
          <p className="page-subtitle">Heuristic indicators + AI analyst write-up. Never auto-flags accounts.</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Bid sequence</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Auction ID (optional)</label>
              <input className="form-input" value={form.auction_id} onChange={(e) => setField('auction_id', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Lot ID (optional)</label>
              <input className="form-input" value={form.lot_id} onChange={(e) => setField('lot_id', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label>Bids JSON</label>
            <textarea className="form-textarea" rows={10} value={form.bidsJson} onChange={(e) => setField('bidsJson', e.target.value)} />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Analyzing...</span> : 'Detect'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Bid-Integrity Analysis" />}
    </div>
  );
}

export default ShillBiddingDetectionPage;
