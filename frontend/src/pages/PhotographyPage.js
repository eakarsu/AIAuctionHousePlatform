import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { item_id: '', photographer: '', studio_location: '', scheduled_date: '', duration_minutes: '', shoot_type: 'Standard', status: 'scheduled', notes: '' };

function PhotographyPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/photography'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.photographer || '').toLowerCase().includes(q) || (r.studio_location || '').toLowerCase().includes(q) || (r.shoot_type || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ item_id: r.item_id || '', photographer: r.photographer || '', studio_location: r.studio_location || '', scheduled_date: r.scheduled_date || '', duration_minutes: r.duration_minutes || '', shoot_type: r.shoot_type || 'Standard', status: r.status || 'scheduled', notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/photography/${editing.id}`, form); } else { await api.post('/photography', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this photography record?')) return;
    try { await api.delete(`/photography/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  if (loading) return <div className="loading-spinner-lg">Loading photography records...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Photography</h1><p className="page-subtitle">Schedule and manage item photo sessions</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search photography..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Item ID</th><th>Photographer</th><th>Studio</th><th>Scheduled Date</th><th>Duration</th><th>Shoot Type</th><th>Status</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="7" className="table-empty">No photography records found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Item #{r.item_id}</td><td><strong>{r.photographer || '-'}</strong></td><td>{r.studio_location || '-'}</td>
            <td>{r.scheduled_date ? new Date(r.scheduled_date).toLocaleString() : '-'}</td><td>{r.duration_minutes ? `${r.duration_minutes} min` : '-'}</td><td>{r.shoot_type}</td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Photography Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Item ID', selected.item_id], ['Photographer', selected.photographer], ['Studio Location', selected.studio_location], ['Scheduled Date', selected.scheduled_date ? new Date(selected.scheduled_date).toLocaleString() : '-'], ['Duration', selected.duration_minutes ? `${selected.duration_minutes} min` : '-'], ['Shoot Type', selected.shoot_type], ['Status', selected.status], ['Notes', selected.notes]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Photography' : 'Add Photography'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Item ID</label><input type="number" className="form-input" value={form.item_id} onChange={e => setField('item_id', e.target.value)} required /></div>
            <div className="form-group"><label>Photographer</label><input className="form-input" value={form.photographer} onChange={e => setField('photographer', e.target.value)} required /></div>
          </div>
          <div className="form-group"><label>Studio Location</label><input className="form-input" value={form.studio_location} onChange={e => setField('studio_location', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Scheduled Date</label><input type="datetime-local" className="form-input" value={form.scheduled_date} onChange={e => setField('scheduled_date', e.target.value)} /></div>
            <div className="form-group"><label>Duration (minutes)</label><input type="number" className="form-input" value={form.duration_minutes} onChange={e => setField('duration_minutes', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Shoot Type</label><select className="form-select" value={form.shoot_type} onChange={e => setField('shoot_type', e.target.value)}><option>Standard</option><option>360 View</option><option>Detail Shots</option><option>Lifestyle</option><option>Video</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="scheduled">Scheduled</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default PhotographyPage;
