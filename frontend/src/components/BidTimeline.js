import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../api';

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload;
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #ccc',
        borderRadius: 4,
        padding: 8,
        fontSize: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      }}
    >
      <div><strong>Bid #{p.sequence}</strong></div>
      <div>Amount: ${p.amount.toLocaleString()}</div>
      <div>Bidder: {p.bidder} (paddle {p.paddle})</div>
      <div>Type: {p.bid_type}</div>
      {p.is_winning && <div style={{ color: '#0a7' }}>WINNING BID</div>}
    </div>
  );
}

export default function BidTimeline() {
  const [data, setData] = useState({ bids: [], lots: [], item: null });
  const [selectedItemId, setSelectedItemId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async (itemId) => {
    setLoading(true);
    setError(null);
    try {
      const q = itemId ? `?itemId=${itemId}` : '';
      const r = await api.get(`/custom-views/bid-timeline${q}`);
      setData(r.data);
      if (!itemId && r.data.itemId) setSelectedItemId(String(r.data.itemId));
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSelect = (e) => {
    const v = e.target.value;
    setSelectedItemId(v);
    load(v);
  };

  const chartData = data.bids.map((b) => ({
    ...b,
    x: b.sequence,
    y: b.amount,
    z: b.amount,
  }));

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
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, flex: 1 }}>Live Bid Timeline</h3>
        <select
          value={selectedItemId}
          onChange={onSelect}
          style={{
            padding: '6px 10px',
            border: '1px solid #ccc',
            borderRadius: 4,
          }}
        >
          <option value="">-- pick a lot --</option>
          {data.lots.map((l) => (
            <option key={l.id} value={l.id}>
              Lot {l.lot_number || l.id}: {l.title} ({l.bid_count} bids)
            </option>
          ))}
        </select>
      </div>

      {loading && <div>Loading bid timeline...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {!loading && !error && data.item && (
        <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>
          Showing bids for: <strong>{data.item.title}</strong>
          {data.item.estimate_low && data.item.estimate_high && (
            <>
              {' '}
              · Estimate ${Number(data.item.estimate_low).toLocaleString()}
              –${Number(data.item.estimate_high).toLocaleString()}
            </>
          )}
        </div>
      )}

      {!loading && !error && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={360}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name="Bid #"
              label={{
                value: 'Bid sequence',
                position: 'insideBottom',
                offset: -10,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Amount"
              tickFormatter={(v) => `$${Number(v).toLocaleString()}`}
              label={{ value: 'Bid amount', angle: -90, position: 'insideLeft' }}
            />
            <ZAxis type="number" dataKey="z" range={[60, 400]} name="amount" />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Legend />
            <Scatter name="Bids" data={chartData} fill="#b8860b" />
          </ScatterChart>
        </ResponsiveContainer>
      )}

      {!loading && !error && chartData.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
          No bids found for this lot.
        </div>
      )}
    </div>
  );
}
