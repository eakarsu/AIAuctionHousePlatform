import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { item_id: '', check_type: 'Stolen Art Check', database_checked: '', result: 'pending', details: '', checked_by: '', expiry_date: '', certificate_number: '', notes: '' };

function CompliancePage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/compliance'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.check_type || '').toLowerCase().includes(q) || (r.result || '').toLowerCase().includes(q) || (r.checked_by || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ item_id: r.item_id || '', check_type: r.check_type || 'Stolen Art Check', database_checked: r.database_checked || '', result: r.result || 'pending', details: r.details || '', checked_by: r.checked_by || '', expiry_date: r.expiry_date ? r.expiry_date.slice(0, 10) : '', certificate_number: r.certificate_number || '', notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/compliance/${editing.id}`, form); } else { await api.post('/compliance', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this compliance record?')) return;
    try { await api.delete(`/compliance/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  if (loading) return <div className="loading-spinner-lg">Loading compliance records...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Compliance</h1><p className="page-subtitle">Provenance verification and regulatory checks</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search compliance..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Item</th><th>Check Type</th><th>Database</th><th>Result</th><th>Checked By</th><th>Date</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="6" className="table-empty">No compliance records found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Item #{r.item_id}</td><td><strong>{r.check_type}</strong></td><td>{r.database_checked || '-'}</td>
            <td><span className={`status-badge ${r.result}`}>{r.result}</span></td>
            <td>{r.checked_by || '-'}</td><td>{fmtDate(r.created_at)}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Compliance Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Item ID', selected.item_id], ['Check Type', selected.check_type], ['Database Checked', selected.database_checked], ['Result', selected.result], ['Details', selected.details], ['Checked By', selected.checked_by], ['Expiry Date', fmtDate(selected.expiry_date)], ['Certificate Number', selected.certificate_number], ['Notes', selected.notes], ['Date', fmtDate(selected.created_at)]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Compliance' : 'Add Compliance'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Item ID</label><input type="number" className="form-input" value={form.item_id} onChange={e => setField('item_id', e.target.value)} required /></div>
            <div className="form-group"><label>Check Type</label><select className="form-select" value={form.check_type} onChange={e => setField('check_type', e.target.value)}><option>Stolen Art Check</option><option>Export Regulation</option><option>Provenance Verification</option><option>CITES</option><option>Sanctions</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Database Checked</label><input className="form-input" value={form.database_checked} onChange={e => setField('database_checked', e.target.value)} /></div>
            <div className="form-group"><label>Result</label><select className="form-select" value={form.result} onChange={e => setField('result', e.target.value)}><option value="clear">Clear</option><option value="flagged">Flagged</option><option value="pending">Pending</option><option value="requires_review">Requires Review</option></select></div>
          </div>
          <div className="form-group"><label>Details</label><textarea className="form-textarea" value={form.details} onChange={e => setField('details', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Checked By</label><input className="form-input" value={form.checked_by} onChange={e => setField('checked_by', e.target.value)} /></div>
            <div className="form-group"><label>Certificate Number</label><input className="form-input" value={form.certificate_number} onChange={e => setField('certificate_number', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Expiry Date</label><input type="date" className="form-input" value={form.expiry_date} onChange={e => setField('expiry_date', e.target.value)} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default CompliancePage;
