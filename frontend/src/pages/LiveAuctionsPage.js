import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { auction_id: '', item_id: '', bidder_id: '', bid_amount: '', bid_type: 'live', is_winning: false };

function LiveAuctionsPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/live-auctions'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.bid_type || '').toLowerCase().includes(q) || String(r.bid_amount || '').includes(q) || String(r.auction_id || '').includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ auction_id: r.auction_id || '', item_id: r.item_id || '', bidder_id: r.bidder_id || '', bid_amount: r.bid_amount || '', bid_type: r.bid_type || 'live', is_winning: r.is_winning || false });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, is_winning: form.is_winning ? true : false };
      if (editing) { await api.put(`/live-auctions/${editing.id}`, payload); } else { await api.post('/live-auctions', payload); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bid?')) return;
    try { await api.delete(`/live-auctions/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading bids...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Live Auctions</h1><p className="page-subtitle">Manage real-time bidding activity</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search bids..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Auction</th><th>Item</th><th>Bidder</th><th>Bid Amount</th><th>Bid Type</th><th>Winning?</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="6" className="table-empty">No bids found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Auction #{r.auction_id}</td><td>Item #{r.item_id}</td><td>Bidder #{r.bidder_id}</td>
            <td><strong>{fmt(r.bid_amount)}</strong></td><td>{r.bid_type}</td>
            <td><span className={`status-badge ${r.is_winning ? 'active' : 'pending'}`}>{r.is_winning ? 'Yes' : 'No'}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Bid Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Auction ID', selected.auction_id], ['Item ID', selected.item_id], ['Bidder ID', selected.bidder_id], ['Bid Amount', fmt(selected.bid_amount)], ['Bid Type', selected.bid_type], ['Winning', selected.is_winning ? 'Yes' : 'No'], ['Created', selected.created_at ? new Date(selected.created_at).toLocaleString() : '-']].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Bid' : 'Add Bid'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Auction ID</label><input type="number" className="form-input" value={form.auction_id} onChange={e => setField('auction_id', e.target.value)} required /></div>
            <div className="form-group"><label>Item ID</label><input type="number" className="form-input" value={form.item_id} onChange={e => setField('item_id', e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Bidder ID</label><input type="number" className="form-input" value={form.bidder_id} onChange={e => setField('bidder_id', e.target.value)} required /></div>
            <div className="form-group"><label>Bid Amount</label><input type="number" step="0.01" className="form-input" value={form.bid_amount} onChange={e => setField('bid_amount', e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Bid Type</label><select className="form-select" value={form.bid_type} onChange={e => setField('bid_type', e.target.value)}><option value="live">Live</option><option value="phone">Phone</option><option value="absentee">Absentee</option><option value="online">Online</option></select></div>
            <div className="form-group"><label>Winning Bid</label><div className="form-checkbox" style={{marginTop: '8px'}}><input type="checkbox" checked={form.is_winning} onChange={e => setField('is_winning', e.target.checked)} /><span>This is the winning bid</span></div></div>
          </div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default LiveAuctionsPage;
