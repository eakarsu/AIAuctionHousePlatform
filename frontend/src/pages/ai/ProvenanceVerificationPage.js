import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

function ProvenanceVerificationPage() {
  const [form, setForm] = useState({
    title: '',
    artist: '',
    category: 'Fine Art',
    claimed_provenance: '',
    exhibition_history: '',
    publications: '',
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
      const res = await api.post('/ai/provenance-verification', form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Provenance verification failed');
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Provenance Verification</h1>
          <p className="page-subtitle">Cross-reference claimed provenance against public records and stolen-art databases</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Item &amp; Provenance Chain</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Title</label>
              <input className="form-input" value={form.title}
                onChange={(e) => setField('title', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Artist / Maker</label>
              <input className="form-input" value={form.artist}
                onChange={(e) => setField('artist', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select className="form-select" value={form.category}
                onChange={(e) => setField('category', e.target.value)}>
                {['Fine Art', 'Antiques', 'Sculptures', 'Asian Art',
                  'Old Masters', 'Contemporary Art', 'Decorative Arts',
                  'Books & Manuscripts', 'Jewelry'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Claimed Provenance Chain</label>
            <textarea className="form-textarea" rows={5}
              value={form.claimed_provenance}
              onChange={(e) => setField('claimed_provenance', e.target.value)}
              placeholder={'1947 - Galerie X, Paris\n1962 - Private collection (USA)\n2001 - Christie\'s NY, lot 89'} />
          </div>
          <div className="form-group">
            <label>Exhibition History</label>
            <textarea className="form-textarea" rows={3}
              value={form.exhibition_history}
              onChange={(e) => setField('exhibition_history', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Publications / Catalogue Raisonné references</label>
            <textarea className="form-textarea" rows={3}
              value={form.publications}
              onChange={(e) => setField('publications', e.target.value)} />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Provenance'}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Provenance Verification Report" />}
    </div>
  );
}

export default ProvenanceVerificationPage;
