import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { item_id: '', inspector_name: '', overall_condition: 'Good', structural_integrity: '', surface_condition: '', damage_description: '', restoration_history: '', recommendations: '' };

function ConditionsPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/conditions'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.inspector_name || '').toLowerCase().includes(q) || (r.overall_condition || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ item_id: r.item_id || '', inspector_name: r.inspector_name || '', overall_condition: r.overall_condition || 'Good', structural_integrity: r.structural_integrity || '', surface_condition: r.surface_condition || '', damage_description: r.damage_description || '', restoration_history: r.restoration_history || '', recommendations: r.recommendations || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/conditions/${editing.id}`, form); } else { await api.post('/conditions', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this condition report?')) return;
    try { await api.delete(`/conditions/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  if (loading) return <div className="loading-spinner-lg">Loading condition reports...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Condition Reports</h1><p className="page-subtitle">Document and track item conditions</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search conditions..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Item</th><th>Inspector</th><th>Overall</th><th>Structural</th><th>Surface</th><th>Date</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="6" className="table-empty">No condition reports found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Item #{r.item_id}</td><td><strong>{r.inspector_name || '-'}</strong></td>
            <td><span className={`status-badge ${(r.overall_condition || '').toLowerCase()}`}>{r.overall_condition}</span></td>
            <td>{r.structural_integrity || '-'}</td><td>{r.surface_condition || '-'}</td><td>{fmtDate(r.created_at)}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Condition Report</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Item ID', selected.item_id], ['Inspector', selected.inspector_name], ['Overall Condition', selected.overall_condition], ['Structural Integrity', selected.structural_integrity], ['Surface Condition', selected.surface_condition], ['Damage Description', selected.damage_description], ['Restoration History', selected.restoration_history], ['Recommendations', selected.recommendations], ['Date', fmtDate(selected.created_at)]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Condition Report' : 'Add Condition Report'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Item ID</label><input type="number" className="form-input" value={form.item_id} onChange={e => setField('item_id', e.target.value)} required /></div>
            <div className="form-group"><label>Inspector Name</label><input className="form-input" value={form.inspector_name} onChange={e => setField('inspector_name', e.target.value)} required /></div>
          </div>
          <div className="form-group"><label>Overall Condition</label><select className="form-select" value={form.overall_condition} onChange={e => setField('overall_condition', e.target.value)}><option>Excellent</option><option>Good</option><option>Fair</option><option>Poor</option><option>Damaged</option></select></div>
          <div className="form-row">
            <div className="form-group"><label>Structural Integrity</label><input className="form-input" value={form.structural_integrity} onChange={e => setField('structural_integrity', e.target.value)} /></div>
            <div className="form-group"><label>Surface Condition</label><input className="form-input" value={form.surface_condition} onChange={e => setField('surface_condition', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Damage Description</label><textarea className="form-textarea" value={form.damage_description} onChange={e => setField('damage_description', e.target.value)} /></div>
          <div className="form-group"><label>Restoration History</label><textarea className="form-textarea" value={form.restoration_history} onChange={e => setField('restoration_history', e.target.value)} /></div>
          <div className="form-group"><label>Recommendations</label><textarea className="form-textarea" value={form.recommendations} onChange={e => setField('recommendations', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default ConditionsPage;
