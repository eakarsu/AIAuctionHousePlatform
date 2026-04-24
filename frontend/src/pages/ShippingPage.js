import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { invoice_id: '', item_id: '', bidder_id: '', carrier: '', tracking_number: '', shipping_method: 'Standard', shipping_cost: '', insurance_value: '', status: 'pending', destination_address: '', special_instructions: '' };

function ShippingPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/shipping'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.carrier || '').toLowerCase().includes(q) || (r.tracking_number || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ invoice_id: r.invoice_id || '', item_id: r.item_id || '', bidder_id: r.bidder_id || '', carrier: r.carrier || '', tracking_number: r.tracking_number || '', shipping_method: r.shipping_method || 'Standard', shipping_cost: r.shipping_cost || '', insurance_value: r.insurance_value || '', status: r.status || 'pending', destination_address: r.destination_address || '', special_instructions: r.special_instructions || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/shipping/${editing.id}`, form); } else { await api.post('/shipping', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shipping record?')) return;
    try { await api.delete(`/shipping/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading shipping records...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Shipping</h1><p className="page-subtitle">Track shipping and delivery logistics</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search shipping..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Item</th><th>Bidder</th><th>Carrier</th><th>Tracking #</th><th>Method</th><th>Cost</th><th>Status</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="7" className="table-empty">No shipping records found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Item #{r.item_id}</td><td>Bidder #{r.bidder_id}</td><td>{r.carrier || '-'}</td>
            <td><strong>{r.tracking_number || '-'}</strong></td><td>{r.shipping_method}</td><td>{fmt(r.shipping_cost)}</td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Shipping Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Invoice ID', selected.invoice_id], ['Item ID', selected.item_id], ['Bidder ID', selected.bidder_id], ['Carrier', selected.carrier], ['Tracking Number', selected.tracking_number], ['Method', selected.shipping_method], ['Shipping Cost', fmt(selected.shipping_cost)], ['Insurance Value', fmt(selected.insurance_value)], ['Status', selected.status], ['Destination', selected.destination_address], ['Special Instructions', selected.special_instructions]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Shipping' : 'Add Shipping'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Invoice ID</label><input type="number" className="form-input" value={form.invoice_id} onChange={e => setField('invoice_id', e.target.value)} /></div>
            <div className="form-group"><label>Item ID</label><input type="number" className="form-input" value={form.item_id} onChange={e => setField('item_id', e.target.value)} required /></div>
          </div>
          <div className="form-group"><label>Bidder ID</label><input type="number" className="form-input" value={form.bidder_id} onChange={e => setField('bidder_id', e.target.value)} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Carrier</label><input className="form-input" value={form.carrier} onChange={e => setField('carrier', e.target.value)} /></div>
            <div className="form-group"><label>Tracking Number</label><input className="form-input" value={form.tracking_number} onChange={e => setField('tracking_number', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Shipping Method</label><select className="form-select" value={form.shipping_method} onChange={e => setField('shipping_method', e.target.value)}><option>Standard</option><option>Express</option><option>Freight</option><option>White Glove</option><option>Pickup</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="pending">Pending</option><option value="packed">Packed</option><option value="shipped">Shipped</option><option value="in_transit">In Transit</option><option value="delivered">Delivered</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Shipping Cost</label><input type="number" step="0.01" className="form-input" value={form.shipping_cost} onChange={e => setField('shipping_cost', e.target.value)} /></div>
            <div className="form-group"><label>Insurance Value</label><input type="number" step="0.01" className="form-input" value={form.insurance_value} onChange={e => setField('insurance_value', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Destination Address</label><textarea className="form-textarea" value={form.destination_address} onChange={e => setField('destination_address', e.target.value)} /></div>
          <div className="form-group"><label>Special Instructions</label><textarea className="form-textarea" value={form.special_instructions} onChange={e => setField('special_instructions', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default ShippingPage;
