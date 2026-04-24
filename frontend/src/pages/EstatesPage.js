import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { estate_name: '', contact_person: '', contact_email: '', contact_phone: '', estate_address: '', total_items: '', estimated_value: '', sale_date: '', status: 'consultation', assigned_specialist: '', notes: '' };

function EstatesPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/estates'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.estate_name || '').toLowerCase().includes(q) || (r.contact_person || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ estate_name: r.estate_name || '', contact_person: r.contact_person || '', contact_email: r.contact_email || '', contact_phone: r.contact_phone || '', estate_address: r.estate_address || '', total_items: r.total_items || '', estimated_value: r.estimated_value || '', sale_date: r.sale_date || '', status: r.status || 'consultation', assigned_specialist: r.assigned_specialist || '', notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/estates/${editing.id}`, form); } else { await api.post('/estates', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this estate record?')) return;
    try { await api.delete(`/estates/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading estates...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Estate Sales</h1><p className="page-subtitle">Coordinate estate sale projects and evaluations</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search estates..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Estate Name</th><th>Contact</th><th>Email</th><th>Phone</th><th>Total Items</th><th>Estimated Value</th><th>Sale Date</th><th>Status</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="8" className="table-empty">No estates found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td><strong>{r.estate_name || '-'}</strong></td><td>{r.contact_person || '-'}</td><td>{r.contact_email || '-'}</td>
            <td>{r.contact_phone || '-'}</td><td>{r.total_items || 0}</td><td>{fmt(r.estimated_value)}</td>
            <td>{r.sale_date || '-'}</td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Estate Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Estate Name', selected.estate_name], ['Contact Person', selected.contact_person], ['Email', selected.contact_email], ['Phone', selected.contact_phone], ['Address', selected.estate_address], ['Total Items', selected.total_items || 0], ['Estimated Value', fmt(selected.estimated_value)], ['Sale Date', selected.sale_date], ['Status', selected.status], ['Assigned Specialist', selected.assigned_specialist], ['Notes', selected.notes]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Estate' : 'Add Estate'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-group"><label>Estate Name</label><input className="form-input" value={form.estate_name} onChange={e => setField('estate_name', e.target.value)} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Contact Person</label><input className="form-input" value={form.contact_person} onChange={e => setField('contact_person', e.target.value)} /></div>
            <div className="form-group"><label>Contact Email</label><input type="email" className="form-input" value={form.contact_email} onChange={e => setField('contact_email', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Contact Phone</label><input className="form-input" value={form.contact_phone} onChange={e => setField('contact_phone', e.target.value)} /></div>
          <div className="form-group"><label>Estate Address</label><textarea className="form-textarea" value={form.estate_address} onChange={e => setField('estate_address', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Total Items</label><input type="number" className="form-input" value={form.total_items} onChange={e => setField('total_items', e.target.value)} /></div>
            <div className="form-group"><label>Estimated Value</label><input type="number" step="0.01" className="form-input" value={form.estimated_value} onChange={e => setField('estimated_value', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Sale Date</label><input type="date" className="form-input" value={form.sale_date} onChange={e => setField('sale_date', e.target.value)} /></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="consultation">Consultation</option><option value="evaluation">Evaluation</option><option value="contracted">Contracted</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          </div>
          <div className="form-group"><label>Assigned Specialist</label><input className="form-input" value={form.assigned_specialist} onChange={e => setField('assigned_specialist', e.target.value)} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default EstatesPage;
