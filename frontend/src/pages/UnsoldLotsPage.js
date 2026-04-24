import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { item_id: '', auction_id: '', reason: '', action_taken: 'pending_review', reoffer_auction_id: '', buy_now_price: '', return_to_consignor: false, notes: '' };

function UnsoldLotsPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/unsold-lots'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.reason || '').toLowerCase().includes(q) || (r.action_taken || '').toLowerCase().includes(q) || String(r.item_id || '').includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ item_id: r.item_id || '', auction_id: r.auction_id || '', reason: r.reason || '', action_taken: r.action_taken || 'pending_review', reoffer_auction_id: r.reoffer_auction_id || '', buy_now_price: r.buy_now_price || '', return_to_consignor: r.return_to_consignor || false, notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/unsold-lots/${editing.id}`, form); } else { await api.post('/unsold-lots', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this unsold lot record?')) return;
    try { await api.delete(`/unsold-lots/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading unsold lots...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Unsold Lots</h1><p className="page-subtitle">Manage disposition of unsold auction items</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search unsold lots..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Item ID</th><th>Auction ID</th><th>Reason</th><th>Action Taken</th><th>Buy Now Price</th><th>Return to Consignor</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="6" className="table-empty">No unsold lots found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Item #{r.item_id}</td><td>Auction #{r.auction_id}</td><td>{r.reason || '-'}</td>
            <td><span className={`status-badge ${r.action_taken}`}>{r.action_taken}</span></td>
            <td>{fmt(r.buy_now_price)}</td>
            <td>{r.return_to_consignor ? 'Yes' : 'No'}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Unsold Lot Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Item ID', selected.item_id], ['Auction ID', selected.auction_id], ['Reason', selected.reason], ['Action Taken', selected.action_taken], ['Reoffer Auction ID', selected.reoffer_auction_id], ['Buy Now Price', fmt(selected.buy_now_price)], ['Return to Consignor', selected.return_to_consignor ? 'Yes' : 'No'], ['Notes', selected.notes]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Unsold Lot' : 'Add Unsold Lot'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Item ID</label><input type="number" className="form-input" value={form.item_id} onChange={e => setField('item_id', e.target.value)} required /></div>
            <div className="form-group"><label>Auction ID</label><input type="number" className="form-input" value={form.auction_id} onChange={e => setField('auction_id', e.target.value)} required /></div>
          </div>
          <div className="form-group"><label>Reason</label><input className="form-input" value={form.reason} onChange={e => setField('reason', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Action Taken</label><select className="form-select" value={form.action_taken} onChange={e => setField('action_taken', e.target.value)}><option value="pending_review">Pending Review</option><option value="reoffer">Reoffer</option><option value="private_sale">Private Sale</option><option value="return_to_consignor">Return to Consignor</option><option value="store">Store</option></select></div>
            <div className="form-group"><label>Reoffer Auction ID</label><input type="number" className="form-input" value={form.reoffer_auction_id} onChange={e => setField('reoffer_auction_id', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Buy Now Price</label><input type="number" step="0.01" className="form-input" value={form.buy_now_price} onChange={e => setField('buy_now_price', e.target.value)} /></div>
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}><input type="checkbox" checked={form.return_to_consignor} onChange={e => setField('return_to_consignor', e.target.checked)} /><label>Return to Consignor</label></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default UnsoldLotsPage;
