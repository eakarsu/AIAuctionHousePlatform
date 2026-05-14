import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function BuyerPreferencePage() {
  const [bidderName, setBidderName] = useState('');
  const [categoriesOfInterest, setCategoriesOfInterest] = useState('');
  const [historyText, setHistoryText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parseHistory = () => {
    if (!historyText.trim()) return [];
    return historyText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        // Format: title|category|price|date
        const [title, category, price, date] = line.split('|').map((s) => s && s.trim());
        return {
          title: title || 'lot',
          category: category || '',
          price: price ? Number(price) : 0,
          date: date || '',
        };
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/ai/buyer-preference-predictor', {
        bidder_name: bidderName,
        categories_of_interest: categoriesOfInterest
          .split(',').map((s) => s.trim()).filter(Boolean),
        purchase_history: parseHistory(),
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Buyer preference prediction failed');
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Buyer Preference Predictor</h1>
          <p className="page-subtitle">Predict categories, price tiers, and styles a bidder will respond to</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Bidder &amp; History</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Bidder Name</label>
              <input className="form-input" value={bidderName}
                onChange={(e) => setBidderName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Self-declared Interests (comma separated)</label>
              <input className="form-input" value={categoriesOfInterest}
                onChange={(e) => setCategoriesOfInterest(e.target.value)}
                placeholder="Old Masters, Asian Art, Sculpture" />
            </div>
          </div>
          <div className="form-group">
            <label>Purchase History (one per line: title|category|price|date)</label>
            <textarea className="form-textarea" rows={6}
              value={historyText}
              onChange={(e) => setHistoryText(e.target.value)}
              placeholder={'Tang Horse Bronze|Asian Art|14000|2024-09-12\nMing Vase|Asian Art|22000|2025-02-03'} />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? 'Predicting...' : 'Predict Preferences'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Buyer Preference Profile" />}
    </div>
  );
}

export default BuyerPreferencePage;
