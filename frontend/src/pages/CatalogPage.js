import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { auction_id: '', item_id: '', lot_sequence: '', page_number: '', catalog_text: '', status: 'draft' };

function CatalogPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/catalog'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.catalog_text || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q) || String(r.item_id || '').includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ auction_id: r.auction_id || '', item_id: r.item_id || '', lot_sequence: r.lot_sequence || '', page_number: r.page_number || '', catalog_text: r.catalog_text || '', status: r.status || 'draft' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/catalog/${editing.id}`, form); } else { await api.post('/catalog', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this catalog entry?')) return;
    try { await api.delete(`/catalog/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  if (loading) return <div className="loading-spinner-lg">Loading catalog entries...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Catalog</h1><p className="page-subtitle">Manage auction catalog entries and lot descriptions</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search catalog..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Auction ID</th><th>Item ID</th><th>Lot Sequence</th><th>Page #</th><th>Status</th><th>Preview</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="6" className="table-empty">No catalog entries found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td>Auction #{r.auction_id}</td><td>Item #{r.item_id}</td><td>{r.lot_sequence || '-'}</td>
            <td>{r.page_number || '-'}</td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
            <td>{r.catalog_text ? r.catalog_text.substring(0, 50) + (r.catalog_text.length > 50 ? '...' : '') : '-'}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Catalog Entry Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Auction ID', selected.auction_id], ['Item ID', selected.item_id], ['Lot Sequence', selected.lot_sequence], ['Page Number', selected.page_number], ['Status', selected.status], ['Catalog Text', selected.catalog_text]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Catalog Entry' : 'Add Catalog Entry'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Auction ID</label><input type="number" className="form-input" value={form.auction_id} onChange={e => setField('auction_id', e.target.value)} required /></div>
            <div className="form-group"><label>Item ID</label><input type="number" className="form-input" value={form.item_id} onChange={e => setField('item_id', e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Lot Sequence</label><input type="number" className="form-input" value={form.lot_sequence} onChange={e => setField('lot_sequence', e.target.value)} /></div>
            <div className="form-group"><label>Page Number</label><input type="number" className="form-input" value={form.page_number} onChange={e => setField('page_number', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Catalog Text</label><textarea className="form-textarea" rows="6" value={form.catalog_text} onChange={e => setField('catalog_text', e.target.value)} /></div>
          <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="draft">Draft</option><option value="review">Review</option><option value="approved">Approved</option><option value="published">Published</option></select></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default CatalogPage;
