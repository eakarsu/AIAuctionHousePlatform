import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function ExternalAuctionSearchPage() {
  const [form, setForm] = useState({ query: '', category: '', max_results: 10 });
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
      const res = await api.post('/ai/external-auction-search', {
        ...form,
        max_results: Number(form.max_results) || 10,
      });
      setResult(res.data);
    } catch (err) {
      if (err.response && err.response.status === 503) {
        const missing = err.response.data && err.response.data.missing;
        setError(`External auction search unavailable. Set provider credentials on the server (${missing || 'EBAY_API_KEY,SOTHEBYS_API_KEY,INVALUABLE_API_KEY,ARTNET_API_KEY'}).`);
      } else {
        setError(err.response?.data?.error || 'Failed to search external auctions');
      }
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">External Auction Search</h1>
          <p className="page-subtitle">eBay / Sotheby's / Invaluable / Artnet — provider stub gated by credentials</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Search</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Query</label>
            <input className="form-input" value={form.query} onChange={(e) => setField('query', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <input className="form-input" value={form.category} onChange={(e) => setField('category', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Max Results</label>
              <input type="number" className="form-input" value={form.max_results} onChange={(e) => setField('max_results', e.target.value)} />
            </div>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? <span className="loading-spinner">Searching...</span> : 'Search External Auctions'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="External Search" />}
    </div>
  );
}

export default ExternalAuctionSearchPage;
