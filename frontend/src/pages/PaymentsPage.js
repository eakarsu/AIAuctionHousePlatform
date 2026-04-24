import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { invoice_id: '', bidder_id: '', amount: '', payment_method: 'Credit Card', transaction_id: '', status: 'pending', payment_date: '', notes: '' };

function PaymentsPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/payments'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.transaction_id || '').toLowerCase().includes(q) || (r.payment_method || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ invoice_id: r.invoice_id || '', bidder_id: r.bidder_id || '', amount: r.amount || '', payment_method: r.payment_method || 'Credit Card', transaction_id: r.transaction_id || '', status: r.status || 'pending', payment_date: r.payment_date || '', notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/payments/${editing.id}`, form); } else { await api.post('/payments', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment record?')) return;
    try { await api.delete(`/payments/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading payments...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Payments</h1><p className="page-subtitle">Process and track payment transactions</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Invoice #</th><th>Bidder ID</th><th>Amount</th><th>Method</th><th>Transaction ID</th><th>Status</th><th>Date</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="7" className="table-empty">No payments found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Invoice #{r.invoice_id}</td><td>Bidder #{r.bidder_id}</td><td><strong>{fmt(r.amount)}</strong></td>
            <td>{r.payment_method}</td><td>{r.transaction_id || '-'}</td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
            <td>{r.payment_date ? new Date(r.payment_date).toLocaleString() : '-'}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Payment Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Invoice ID', selected.invoice_id], ['Bidder ID', selected.bidder_id], ['Amount', fmt(selected.amount)], ['Payment Method', selected.payment_method], ['Transaction ID', selected.transaction_id], ['Status', selected.status], ['Payment Date', selected.payment_date ? new Date(selected.payment_date).toLocaleString() : '-'], ['Notes', selected.notes]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Payment' : 'Add Payment'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Invoice ID</label><input type="number" className="form-input" value={form.invoice_id} onChange={e => setField('invoice_id', e.target.value)} /></div>
            <div className="form-group"><label>Bidder ID</label><input type="number" className="form-input" value={form.bidder_id} onChange={e => setField('bidder_id', e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Amount</label><input type="number" step="0.01" className="form-input" value={form.amount} onChange={e => setField('amount', e.target.value)} required /></div>
            <div className="form-group"><label>Payment Method</label><select className="form-select" value={form.payment_method} onChange={e => setField('payment_method', e.target.value)}><option>Credit Card</option><option>Wire Transfer</option><option>Check</option><option>ACH</option><option>Cash</option><option>Cryptocurrency</option></select></div>
          </div>
          <div className="form-group"><label>Transaction ID</label><input className="form-input" value={form.transaction_id} onChange={e => setField('transaction_id', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="pending">Pending</option><option value="processing">Processing</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select></div>
            <div className="form-group"><label>Payment Date</label><input type="datetime-local" className="form-input" value={form.payment_date} onChange={e => setField('payment_date', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default PaymentsPage;
