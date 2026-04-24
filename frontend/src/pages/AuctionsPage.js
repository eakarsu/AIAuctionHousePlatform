import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { title: '', auction_type: 'live', category: '', start_date: '', end_date: '', location: '', status: 'upcoming', total_lots: '', buyer_premium_rate: '', description: '' };

function AuctionsPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/auctions'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.title || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ title: r.title || '', auction_type: r.auction_type || 'live', category: r.category || '', start_date: r.start_date ? r.start_date.slice(0, 10) : '', end_date: r.end_date ? r.end_date.slice(0, 10) : '', location: r.location || '', status: r.status || 'upcoming', total_lots: r.total_lots || '', buyer_premium_rate: r.buyer_premium_rate || '', description: r.description || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/auctions/${editing.id}`, form); } else { await api.post('/auctions', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this auction?')) return;
    try { await api.delete(`/auctions/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '-';
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading auctions...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Auctions</h1><p className="page-subtitle">Schedule and manage auction events</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search auctions..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Title</th><th>Type</th><th>Category</th><th>Start Date</th><th>Status</th><th>Total Lots</th><th>Revenue</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="7" className="table-empty">No auctions found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td><strong>{r.title}</strong></td><td>{r.auction_type}</td><td>{r.category || '-'}</td><td>{fmtDate(r.start_date)}</td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td><td>{r.total_lots || 0}</td><td>{fmt(r.revenue)}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>{selected.title}</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Title', selected.title], ['Type', selected.auction_type], ['Category', selected.category], ['Start Date', fmtDate(selected.start_date)], ['End Date', fmtDate(selected.end_date)], ['Location', selected.location], ['Status', selected.status], ['Total Lots', selected.total_lots], ['Buyer Premium', selected.buyer_premium_rate ? `${selected.buyer_premium_rate}%` : '-'], ['Revenue', fmt(selected.revenue)], ['Description', selected.description]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Auction' : 'Add Auction'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-group"><label>Title</label><input className="form-input" value={form.title} onChange={e => setField('title', e.target.value)} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Type</label><select className="form-select" value={form.auction_type} onChange={e => setField('auction_type', e.target.value)}><option value="live">Live</option><option value="online">Online</option><option value="timed">Timed</option></select></div>
            <div className="form-group"><label>Category</label><input className="form-input" value={form.category} onChange={e => setField('category', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Date</label><input type="date" className="form-input" value={form.start_date} onChange={e => setField('start_date', e.target.value)} /></div>
            <div className="form-group"><label>End Date</label><input type="date" className="form-input" value={form.end_date} onChange={e => setField('end_date', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Location</label><input className="form-input" value={form.location} onChange={e => setField('location', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="upcoming">Upcoming</option><option value="active">Active</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
            <div className="form-group"><label>Total Lots</label><input type="number" className="form-input" value={form.total_lots} onChange={e => setField('total_lots', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Buyer Premium Rate (%)</label><input type="number" step="0.01" className="form-input" value={form.buyer_premium_rate} onChange={e => setField('buyer_premium_rate', e.target.value)} /></div>
          <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setField('description', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default AuctionsPage;
