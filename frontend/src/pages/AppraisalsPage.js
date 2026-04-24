import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { item_id: '', appraiser_name: '', appraisal_type: 'Insurance', appraised_value: '', appraisal_date: '', purpose: '', status: 'pending', report_text: '', notes: '' };

function AppraisalsPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/appraisals'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.appraiser_name || '').toLowerCase().includes(q) || (r.appraisal_type || '').toLowerCase().includes(q) || (r.purpose || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ item_id: r.item_id || '', appraiser_name: r.appraiser_name || '', appraisal_type: r.appraisal_type || 'Insurance', appraised_value: r.appraised_value || '', appraisal_date: r.appraisal_date || '', purpose: r.purpose || '', status: r.status || 'pending', report_text: r.report_text || '', notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/appraisals/${editing.id}`, form); } else { await api.post('/appraisals', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appraisal record?')) return;
    try { await api.delete(`/appraisals/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading appraisals...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Appraisals</h1><p className="page-subtitle">Schedule and manage item appraisals</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search appraisals..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Item ID</th><th>Appraiser</th><th>Type</th><th>Appraised Value</th><th>Date</th><th>Purpose</th><th>Status</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="7" className="table-empty">No appraisals found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Item #{r.item_id}</td><td><strong>{r.appraiser_name || '-'}</strong></td><td>{r.appraisal_type}</td>
            <td>{fmt(r.appraised_value)}</td><td>{r.appraisal_date || '-'}</td><td>{r.purpose || '-'}</td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Appraisal Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Item ID', selected.item_id], ['Appraiser', selected.appraiser_name], ['Appraisal Type', selected.appraisal_type], ['Appraised Value', fmt(selected.appraised_value)], ['Appraisal Date', selected.appraisal_date], ['Purpose', selected.purpose], ['Status', selected.status], ['Report Text', selected.report_text], ['Notes', selected.notes]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Appraisal' : 'Add Appraisal'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Item ID</label><input type="number" className="form-input" value={form.item_id} onChange={e => setField('item_id', e.target.value)} required /></div>
            <div className="form-group"><label>Appraiser Name</label><input className="form-input" value={form.appraiser_name} onChange={e => setField('appraiser_name', e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Appraisal Type</label><select className="form-select" value={form.appraisal_type} onChange={e => setField('appraisal_type', e.target.value)}><option>Insurance</option><option>Estate</option><option>Fair Market</option><option>Donation</option><option>Liquidation</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="delivered">Delivered</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Appraised Value</label><input type="number" step="0.01" className="form-input" value={form.appraised_value} onChange={e => setField('appraised_value', e.target.value)} /></div>
            <div className="form-group"><label>Appraisal Date</label><input type="date" className="form-input" value={form.appraisal_date} onChange={e => setField('appraisal_date', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Purpose</label><input className="form-input" value={form.purpose} onChange={e => setField('purpose', e.target.value)} /></div>
          <div className="form-group"><label>Report Text</label><textarea className="form-textarea" rows="6" value={form.report_text} onChange={e => setField('report_text', e.target.value)} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default AppraisalsPage;
