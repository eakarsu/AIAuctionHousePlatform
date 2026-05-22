import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import api from '../api';

export default function LotValueChart() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/custom-views/lot-values');
        setLots(r.data.lots || []);
      } catch (e) {
        setError(e.response?.data?.error || e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chartData = lots.map((l, i) => ({
    name: `#${l.lot_number || l.id}`,
    fullTitle: l.title,
    category: l.category,
    estimate_low: l.estimate_low,
    estimate_high: l.estimate_high,
    rank: i + 1,
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
      <h3 style={{ marginTop: 0 }}>Top 20 Lots by Estimated Value</h3>

      {loading && <div>Loading lot values...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}

      {!loading && !error && chartData.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-35} textAnchor="end" height={60} />
              <YAxis tickFormatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Tooltip
                formatter={(v) => `$${Number(v).toLocaleString()}`}
                labelFormatter={(label, payload) => {
                  const p = payload && payload[0] && payload[0].payload;
                  return p ? `${label} — ${p.fullTitle}` : label;
                }}
              />
              <Legend />
              <Bar dataKey="estimate_low" name="Estimate low" fill="#b8860b" />
              <Bar dataKey="estimate_high" name="Estimate high" fill="#1a5f7a" />
            </BarChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 12, fontSize: 12, color: '#666' }}>
            Showing {chartData.length} lots, ranked by highest estimated value.
          </div>
        </>
      )}

      {!loading && !error && chartData.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: '#888' }}>
          No lots with estimates available.
        </div>
      )}
    </div>
  );
}
