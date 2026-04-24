import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { invoice_number: '', bidder_id: '', auction_id: '', subtotal: '', buyer_premium: '', tax: '', total: '', status: 'pending', due_date: '', notes: '' };

function InvoicesPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/invoices'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.invoice_number || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ invoice_number: r.invoice_number || '', bidder_id: r.bidder_id || '', auction_id: r.auction_id || '', subtotal: r.subtotal || '', buyer_premium: r.buyer_premium || '', tax: r.tax || '', total: r.total || '', status: r.status || 'pending', due_date: r.due_date ? r.due_date.slice(0, 10) : '', notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/invoices/${editing.id}`, form); } else { await api.post('/invoices', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try { await api.delete(`/invoices/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString() : '-';

  if (loading) return <div className="loading-spinner-lg">Loading invoices...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Invoices</h1><p className="page-subtitle">Manage billing and payment tracking</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Invoice #</th><th>Bidder</th><th>Auction</th><th>Subtotal</th><th>Premium</th><th>Total</th><th>Status</th><th>Due Date</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="8" className="table-empty">No invoices found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td><strong>{r.invoice_number || '-'}</strong></td><td>Bidder #{r.bidder_id}</td><td>Auction #{r.auction_id}</td>
            <td>{fmt(r.subtotal)}</td><td>{fmt(r.buyer_premium)}</td><td><strong>{fmt(r.total)}</strong></td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td><td>{fmtDate(r.due_date)}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Invoice {selected.invoice_number}</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Invoice Number', selected.invoice_number], ['Bidder ID', selected.bidder_id], ['Auction ID', selected.auction_id], ['Subtotal', fmt(selected.subtotal)], ['Buyer Premium', fmt(selected.buyer_premium)], ['Tax', fmt(selected.tax)], ['Total', fmt(selected.total)], ['Status', selected.status], ['Due Date', fmtDate(selected.due_date)], ['Notes', selected.notes]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Invoice' : 'Add Invoice'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-group"><label>Invoice Number</label><input className="form-input" value={form.invoice_number} onChange={e => setField('invoice_number', e.target.value)} required /></div>
          <div className="form-row">
            <div className="form-group"><label>Bidder ID</label><input type="number" className="form-input" value={form.bidder_id} onChange={e => setField('bidder_id', e.target.value)} required /></div>
            <div className="form-group"><label>Auction ID</label><input type="number" className="form-input" value={form.auction_id} onChange={e => setField('auction_id', e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Subtotal</label><input type="number" step="0.01" className="form-input" value={form.subtotal} onChange={e => setField('subtotal', e.target.value)} /></div>
            <div className="form-group"><label>Buyer Premium</label><input type="number" step="0.01" className="form-input" value={form.buyer_premium} onChange={e => setField('buyer_premium', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Tax</label><input type="number" step="0.01" className="form-input" value={form.tax} onChange={e => setField('tax', e.target.value)} /></div>
            <div className="form-group"><label>Total</label><input type="number" step="0.01" className="form-input" value={form.total} onChange={e => setField('total', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="pending">Pending</option><option value="sent">Sent</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></div>
            <div className="form-group"><label>Due Date</label><input type="date" className="form-input" value={form.due_date} onChange={e => setField('due_date', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default InvoicesPage;
