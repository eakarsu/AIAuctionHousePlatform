import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { name: '', email: '', phone: '', address: '', paddle_number: '', verification_status: 'pending', deposit_amount: '', preferred_categories: '', bidding_limit: '', notes: '' };

function BiddersPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/bidders'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.name || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q) || (r.paddle_number || '').toString().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ name: r.name || '', email: r.email || '', phone: r.phone || '', address: r.address || '', paddle_number: r.paddle_number || '', verification_status: r.verification_status || 'pending', deposit_amount: r.deposit_amount || '', preferred_categories: r.preferred_categories || '', bidding_limit: r.bidding_limit || '', notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/bidders/${editing.id}`, form); } else { await api.post('/bidders', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bidder?')) return;
    try { await api.delete(`/bidders/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading bidders...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Bidders</h1><p className="page-subtitle">Register and manage bidder accounts</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search bidders..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Name</th><th>Email</th><th>Paddle #</th><th>Verification</th><th>Deposit</th><th>Total Purchases</th><th>Bidding Limit</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="7" className="table-empty">No bidders found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td><strong>{r.name}</strong></td><td>{r.email}</td><td>{r.paddle_number || '-'}</td>
            <td><span className={`status-badge ${r.verification_status}`}>{r.verification_status}</span></td>
            <td>{fmt(r.deposit_amount)}</td><td>{fmt(r.total_purchases)}</td><td>{fmt(r.bidding_limit)}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>{selected.name}</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Name', selected.name], ['Email', selected.email], ['Phone', selected.phone], ['Address', selected.address], ['Paddle Number', selected.paddle_number], ['Verification', selected.verification_status], ['Deposit', fmt(selected.deposit_amount)], ['Preferred Categories', selected.preferred_categories], ['Bidding Limit', fmt(selected.bidding_limit)], ['Total Purchases', fmt(selected.total_purchases)], ['Notes', selected.notes]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Bidder' : 'Add Bidder'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setField('name', e.target.value)} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Email</label><input type="email" className="form-input" value={form.email} onChange={e => setField('email', e.target.value)} required /></div>
            <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone} onChange={e => setField('phone', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Address</label><textarea className="form-textarea" value={form.address} onChange={e => setField('address', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Paddle Number</label><input className="form-input" value={form.paddle_number} onChange={e => setField('paddle_number', e.target.value)} /></div>
            <div className="form-group"><label>Verification Status</label><select className="form-select" value={form.verification_status} onChange={e => setField('verification_status', e.target.value)}><option value="pending">Pending</option><option value="verified">Verified</option><option value="suspended">Suspended</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Deposit Amount</label><input type="number" step="0.01" className="form-input" value={form.deposit_amount} onChange={e => setField('deposit_amount', e.target.value)} /></div>
            <div className="form-group"><label>Bidding Limit</label><input type="number" step="0.01" className="form-input" value={form.bidding_limit} onChange={e => setField('bidding_limit', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Preferred Categories</label><input className="form-input" value={form.preferred_categories} onChange={e => setField('preferred_categories', e.target.value)} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default BiddersPage;
