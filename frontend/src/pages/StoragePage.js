import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { item_id: '', location: '', zone: '', shelf: '', bin_number: '', storage_type: 'Standard', temperature_controlled: false, status: 'stored', expected_release_date: '', special_requirements: '', daily_rate: '' };

function StoragePage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/storage'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.location || '').toLowerCase().includes(q) || (r.zone || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ item_id: r.item_id || '', location: r.location || '', zone: r.zone || '', shelf: r.shelf || '', bin_number: r.bin_number || '', storage_type: r.storage_type || 'Standard', temperature_controlled: r.temperature_controlled || false, status: r.status || 'stored', expected_release_date: r.expected_release_date ? r.expected_release_date.slice(0, 10) : '', special_requirements: r.special_requirements || '', daily_rate: r.daily_rate || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/storage/${editing.id}`, form); } else { await api.post('/storage', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this storage record?')) return;
    try { await api.delete(`/storage/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading storage records...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Storage</h1><p className="page-subtitle">Manage warehouse and storage locations</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search storage..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Item</th><th>Location</th><th>Zone</th><th>Shelf</th><th>Type</th><th>Temp Controlled</th><th>Status</th><th>Daily Rate</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="8" className="table-empty">No storage records found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Item #{r.item_id}</td><td><strong>{r.location || '-'}</strong></td><td>{r.zone || '-'}</td><td>{r.shelf || '-'}</td>
            <td>{r.storage_type}</td><td>{r.temperature_controlled ? 'Yes' : 'No'}</td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td><td>{fmt(r.daily_rate)}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Storage Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Item ID', selected.item_id], ['Location', selected.location], ['Zone', selected.zone], ['Shelf', selected.shelf], ['Bin Number', selected.bin_number], ['Storage Type', selected.storage_type], ['Temperature Controlled', selected.temperature_controlled ? 'Yes' : 'No'], ['Status', selected.status], ['Expected Release', selected.expected_release_date ? new Date(selected.expected_release_date).toLocaleDateString() : '-'], ['Special Requirements', selected.special_requirements], ['Daily Rate', fmt(selected.daily_rate)]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Storage' : 'Add Storage'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-group"><label>Item ID</label><input type="number" className="form-input" value={form.item_id} onChange={e => setField('item_id', e.target.value)} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Location</label><input className="form-input" value={form.location} onChange={e => setField('location', e.target.value)} required /></div>
            <div className="form-group"><label>Zone</label><input className="form-input" value={form.zone} onChange={e => setField('zone', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Shelf</label><input className="form-input" value={form.shelf} onChange={e => setField('shelf', e.target.value)} /></div>
            <div className="form-group"><label>Bin Number</label><input className="form-input" value={form.bin_number} onChange={e => setField('bin_number', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Storage Type</label><select className="form-select" value={form.storage_type} onChange={e => setField('storage_type', e.target.value)}><option>Standard</option><option>Climate Controlled</option><option>High Security</option><option>Oversized</option><option>Hazmat</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="stored">Stored</option><option value="reserved">Reserved</option><option value="in_transit">In Transit</option><option value="released">Released</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Temperature Controlled</label><div className="form-checkbox" style={{marginTop: '8px'}}><input type="checkbox" checked={form.temperature_controlled} onChange={e => setField('temperature_controlled', e.target.checked)} /><span>Yes</span></div></div>
            <div className="form-group"><label>Daily Rate</label><input type="number" step="0.01" className="form-input" value={form.daily_rate} onChange={e => setField('daily_rate', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Expected Release Date</label><input type="date" className="form-input" value={form.expected_release_date} onChange={e => setField('expected_release_date', e.target.value)} /></div>
          <div className="form-group"><label>Special Requirements</label><textarea className="form-textarea" value={form.special_requirements} onChange={e => setField('special_requirements', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default StoragePage;
