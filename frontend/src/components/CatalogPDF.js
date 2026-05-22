import React, { useEffect, useState } from 'react';
import api from '../api';

export default function CatalogPDF() {
  const [auctions, setAuctions] = useState([]);
  const [auctionId, setAuctionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/custom-views/auctions');
        setAuctions(r.data.auctions || []);
        if (r.data.auctions && r.data.auctions[0]) {
          setAuctionId(String(r.data.auctions[0].id));
        }
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const generate = async () => {
    if (!auctionId) {
      setError('Please pick an auction.');
      return;
    }
    setGenerating(true);
    setMessage(null);
    setError(null);
    try {
      const r = await api.get(
        `/custom-views/catalog-pdf?auctionId=${auctionId}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([r.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `catalog_auction_${auctionId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setMessage('Catalog PDF generated and downloaded.');
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: 24,
      }}
    >
      <h3 style={{ marginTop: 0 }}>Auction Catalog PDF</h3>
      <p style={{ color: '#666', fontSize: 13 }}>
        Pick an auction and download a PDF catalog with lot number, description,
        estimate, and image placeholder.
      </p>

      {loading && <div>Loading auctions...</div>}

      {!loading && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            value={auctionId}
            onChange={(e) => setAuctionId(e.target.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              border: '1px solid #ccc',
              borderRadius: 4,
            }}
          >
            <option value="">-- pick an auction --</option>
            {auctions.map((a) => (
              <option key={a.id} value={a.id}>
                #{a.id} · {a.title} ({a.status || 'n/a'})
              </option>
            ))}
          </select>
          <button
            onClick={generate}
            disabled={generating || !auctionId}
            style={{
              background: '#b8860b',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: 4,
              cursor: generating ? 'not-allowed' : 'pointer',
              opacity: generating ? 0.7 : 1,
            }}
          >
            {generating ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      )}

      {message && (
        <div style={{ color: '#0a7', marginTop: 12, fontSize: 13 }}>{message}</div>
      )}
      {error && (
        <div style={{ color: 'red', marginTop: 12, fontSize: 13 }}>Error: {error}</div>
      )}
    </div>
  );
}
