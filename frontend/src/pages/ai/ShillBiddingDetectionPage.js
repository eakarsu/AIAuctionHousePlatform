
import FullAIExamples, { useFullAIExamples } from "../../components/FullAIExamples.jsx";
import React, { useEffect, useState } from 'react';
import api, { listRows } from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function ShillBiddingDetectionPage() {
  const fullAIExamples = useFullAIExamples();

  const sample = JSON.stringify(
    [
      { bidder_id: '', amount: 1000, timestamp: '2026-01-01T10:00:00Z' },
      { bidder_id: '', amount: 1100, timestamp: '2026-01-01T10:00:05Z' },
      { bidder_id: '', amount: 1200, timestamp: '2026-01-01T10:00:08Z' },
      { bidder_id: '', amount: 1300, timestamp: '2026-01-01T10:00:11Z' },
      { bidder_id: '', amount: 1400, timestamp: '2026-01-01T10:00:14Z' },
    ],
    null,
    2
  );
  const [form, setForm] = useState({ auction_id: '', lot_id: '', bidsJson: sample });
  const [auctions, setAuctions] = useState([]);
  const [lots, setLots] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/auctions'), api.get('/items')])
      .then(([auctionResponse, lotResponse]) => {
        if (!active) return;
        setAuctions(listRows(auctionResponse.data));
        setLots(listRows(lotResponse.data));
      })
      .catch(() => { if (active) setError('Auction and lot sources could not be loaded. Refresh to retry.'); });
    return () => { active = false; };
  }, []);

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
    if (!Array.isArray(bids) || bids.length < 3 || bids.some((bid) => !bid.bidder_id)) {
      setError('Add at least three bids with actual bidder references before analysis.');
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
        <form onSubmit={handleSubmit} data-full-ai-workspace="ShillBiddingDetectionPage"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
          <div className="form-row">
            <div className="form-group">
              <label>Auction ID (optional)</label>
              <select className="form-select" value={form.auction_id} onChange={(e) => setField('auction_id', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.auction_id, change: (e) => setField('auction_id', e.target.value), label: "form.auction_id", reference: true, manual: false, json: false, sample: '' }, "p1-2323", undefined)}>
                <option value="">Select an auction…</option>
                {auctions.map((auction) => <option key={auction.id} value={auction.id}>{auction.title || `Auction ${auction.id}`}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Lot ID (optional)</label>
              <select className="form-select" value={form.lot_id} onChange={(e) => setField('lot_id', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.lot_id, change: (e) => setField('lot_id', e.target.value), label: "form.lot_id", reference: true, manual: false, json: false, sample: '' }, "p1-2558", undefined)}>
                <option value="">Select a lot…</option>
                {lots.map((lot) => <option key={lot.id} value={lot.id}>{lot.lot_number ? `${lot.lot_number} · ` : ''}{lot.title || `Lot ${lot.id}`}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Bids JSON</label>
            <textarea className="form-textarea" rows={10} value={form.bidsJson} onChange={(e) => setField('bidsJson', e.target.value)} data-full-ai-field={fullAIExamples.bind({ current: form.bidsJson, change: (e) => setField('bidsJson', e.target.value), label: "form.bidsJson", manual: false, json: true, sample: sample }, "p1-2788", undefined)} />
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
