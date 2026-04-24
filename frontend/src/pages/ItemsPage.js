import React, { useState, useEffect } from 'react';
import api from '../api';

const categories = ['Fine Art', 'Jewelry', 'Antiques', 'Vehicles', 'Wine & Spirits', 'Watches', 'Furniture', 'Sculptures', 'Asian Art', 'Contemporary Art', 'Old Masters', 'Decorative Arts', 'Silver', 'Ceramics', 'Books & Manuscripts'];
const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
const statuses = ['cataloged', 'lotted', 'in_auction', 'sold', 'unsold', 'withdrawn'];
const emptyForm = { title: '', description: '', category: 'Fine Art', consignor_id: '', lot_number: '', dimensions: '', medium: '', condition: 'Good', provenance: '', reserve_price: '', estimate_low: '', estimate_high: '', status: 'cataloged', image_url: '' };

function ItemsPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/items'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.title || '').toLowerCase().includes(q) || (r.lot_number || '').toLowerCase().includes(q) || (r.category || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ title: r.title || '', description: r.description || '', category: r.category || 'Fine Art', consignor_id: r.consignor_id || '', lot_number: r.lot_number || '', dimensions: r.dimensions || '', medium: r.medium || '', condition: r.condition || 'Good', provenance: r.provenance || '', reserve_price: r.reserve_price || '', estimate_low: r.estimate_low || '', estimate_high: r.estimate_high || '', status: r.status || 'cataloged', image_url: r.image_url || '' });
    setEditing(r); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/items/${editing.id}`, form); } else { await api.post('/items', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try { await api.delete(`/items/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading items...</div>;

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Items</h1><p className="page-subtitle">Catalog and manage auction items</p></div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add New</button>
      </div>
      <div className="search-bar"><input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container">
        <table className="data-table">
          <thead><tr className="table-header">
            <th>Lot #</th><th>Title</th><th>Category</th><th>Condition</th><th>Reserve</th><th>Estimate</th><th>Hammer</th><th>Status</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? <tr><td colSpan="8" className="table-empty">No items found</td></tr> : filtered.map(r => (
              <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
                <td><strong>{r.lot_number || '-'}</strong></td>
                <td>{r.title}</td><td>{r.category}</td>
                <td><span className={`status-badge ${(r.condition || '').toLowerCase()}`}>{r.condition}</span></td>
                <td>{fmt(r.reserve_price)}</td>
                <td>{r.estimate_low && r.estimate_high ? `${fmt(r.estimate_low)} - ${fmt(r.estimate_high)}` : '-'}</td>
                <td>{fmt(r.hammer_price)}</td>
                <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div className="detail-panel-overlay" onClick={() => setSelected(null)} />
          <div className="detail-panel">
            <div className="detail-panel-header"><h2>{selected.title}</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
            <div className="detail-panel-body">
              {[['Lot Number', selected.lot_number], ['Title', selected.title], ['Category', selected.category], ['Medium', selected.medium], ['Dimensions', selected.dimensions], ['Condition', selected.condition], ['Provenance', selected.provenance], ['Reserve Price', fmt(selected.reserve_price)], ['Estimate Low', fmt(selected.estimate_low)], ['Estimate High', fmt(selected.estimate_high)], ['Hammer Price', fmt(selected.hammer_price)], ['Status', selected.status], ['Description', selected.description], ['Consignor ID', selected.consignor_id]].map(([l, v]) => (
                <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
              ))}
            </div>
            <div className="detail-panel-actions">
              <button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button>
              <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button>
            </div>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Edit Item' : 'Add Item'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>Title</label><input className="form-input" value={form.title} onChange={e => setField('title', e.target.value)} required /></div>
                <div className="form-group"><label>Description</label><textarea className="form-textarea" value={form.description} onChange={e => setField('description', e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Category</label><select className="form-select" value={form.category} onChange={e => setField('category', e.target.value)}>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="form-group"><label>Lot Number</label><input className="form-input" value={form.lot_number} onChange={e => setField('lot_number', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Medium</label><input className="form-input" value={form.medium} onChange={e => setField('medium', e.target.value)} /></div>
                  <div className="form-group"><label>Dimensions</label><input className="form-input" value={form.dimensions} onChange={e => setField('dimensions', e.target.value)} /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Condition</label><select className="form-select" value={form.condition} onChange={e => setField('condition', e.target.value)}>{conditions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div className="form-group"><label>Consignor ID</label><input type="number" className="form-input" value={form.consignor_id} onChange={e => setField('consignor_id', e.target.value)} /></div>
                </div>
                <div className="form-group"><label>Provenance</label><textarea className="form-textarea" value={form.provenance} onChange={e => setField('provenance', e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Reserve Price</label><input type="number" step="0.01" className="form-input" value={form.reserve_price} onChange={e => setField('reserve_price', e.target.value)} /></div>
                  <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}>{statuses.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label>Estimate Low</label><input type="number" step="0.01" className="form-input" value={form.estimate_low} onChange={e => setField('estimate_low', e.target.value)} /></div>
                  <div className="form-group"><label>Estimate High</label><input type="number" step="0.01" className="form-input" value={form.estimate_high} onChange={e => setField('estimate_high', e.target.value)} /></div>
                </div>
                <div className="form-group"><label>Image URL</label><input className="form-input" value={form.image_url} onChange={e => setField('image_url', e.target.value)} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemsPage;
