import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { name: '', email: '', phone: '', address: '', commission_rate: '', contract_status: 'active', notes: '' };

function ConsignorsPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await api.get('/consignors');
      setRecords(res.data);
      setFiltered(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.name || '').toLowerCase().includes(q) || (r.email || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ name: r.name || '', email: r.email || '', phone: r.phone || '', address: r.address || '', commission_rate: r.commission_rate || '', contract_status: r.contract_status || 'active', notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/consignors/${editing.id}`, form);
      } else {
        await api.post('/consignors', form);
      }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving record'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this record?')) return;
    try {
      await api.delete(`/consignors/${id}`);
      setSelected(null); fetchData();
    } catch (err) { alert('Error deleting record'); }
  };

  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  if (loading) return <div className="loading-spinner-lg">Loading consignors...</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Consignors</h1>
          <p className="page-subtitle">Manage consignor relationships and contracts</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add New</button>
      </div>

      <div className="search-bar">
        <input placeholder="Search consignors..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead><tr className="table-header">
            <th>Name</th><th>Email</th><th>Phone</th><th>Commission</th><th>Status</th><th>Total Consigned</th><th>Total Sold</th>
          </tr></thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7" className="table-empty">No consignors found</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
                <td><strong>{r.name}</strong></td>
                <td>{r.email}</td>
                <td>{r.phone}</td>
                <td>{r.commission_rate ? `${r.commission_rate}%` : '-'}</td>
                <td><span className={`status-badge ${r.contract_status}`}>{r.contract_status}</span></td>
                <td>{r.total_consigned || 0}</td>
                <td>{r.total_sold || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <>
          <div className="detail-panel-overlay" onClick={() => setSelected(null)} />
          <div className="detail-panel">
            <div className="detail-panel-header">
              <h2>{selected.name}</h2>
              <button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="detail-panel-body">
              {[['Name', selected.name], ['Email', selected.email], ['Phone', selected.phone], ['Address', selected.address], ['Commission Rate', selected.commission_rate ? `${selected.commission_rate}%` : '-'], ['Contract Status', selected.contract_status], ['Total Consigned', selected.total_consigned || 0], ['Total Sold', selected.total_sold || 0], ['Notes', selected.notes]].map(([label, value]) => (
                <div className="detail-field" key={label}>
                  <div className="detail-field-label">{label}</div>
                  <div className="detail-field-value">{value || '-'}</div>
                </div>
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
            <div className="modal-header">
              <h2>{editing ? 'Edit Consignor' : 'Add Consignor'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label>Name</label><input className="form-input" value={form.name} onChange={e => setField('name', e.target.value)} required /></div>
                <div className="form-row">
                  <div className="form-group"><label>Email</label><input type="email" className="form-input" value={form.email} onChange={e => setField('email', e.target.value)} required /></div>
                  <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone} onChange={e => setField('phone', e.target.value)} /></div>
                </div>
                <div className="form-group"><label>Address</label><textarea className="form-textarea" value={form.address} onChange={e => setField('address', e.target.value)} /></div>
                <div className="form-row">
                  <div className="form-group"><label>Commission Rate (%)</label><input type="number" step="0.01" className="form-input" value={form.commission_rate} onChange={e => setField('commission_rate', e.target.value)} /></div>
                  <div className="form-group"><label>Contract Status</label>
                    <select className="form-select" value={form.contract_status} onChange={e => setField('contract_status', e.target.value)}>
                      <option value="active">Active</option><option value="pending">Pending</option><option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
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

export default ConsignorsPage;
