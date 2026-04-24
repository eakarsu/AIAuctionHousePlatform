import React, { useState, useEffect } from 'react';
import api from '../api';

const emptyForm = { campaign_name: '', auction_id: '', campaign_type: 'Email', target_audience: '', start_date: '', end_date: '', budget: '', status: 'planned', channels: '', notes: '' };

function CampaignsPage() {
  const [records, setRecords] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { const res = await api.get('/campaigns'); setRecords(res.data); setFiltered(res.data); } catch (err) { console.error(err); }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(records.filter(r => (r.campaign_name || '').toLowerCase().includes(q) || (r.campaign_type || '').toLowerCase().includes(q) || (r.status || '').toLowerCase().includes(q)));
  }, [search, records]);

  const openAdd = () => { setForm(emptyForm); setEditing(null); setShowModal(true); };
  const openEdit = (r) => {
    setForm({ campaign_name: r.campaign_name || '', auction_id: r.auction_id || '', campaign_type: r.campaign_type || 'Email', target_audience: r.target_audience || '', start_date: r.start_date || '', end_date: r.end_date || '', budget: r.budget || '', status: r.status || 'planned', channels: r.channels || '', notes: r.notes || '' });
    setEditing(r); setShowModal(true);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/campaigns/${editing.id}`, form); } else { await api.post('/campaigns', form); }
      setShowModal(false); setSelected(null); fetchData();
    } catch (err) { alert(err.response?.data?.error || 'Error saving'); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try { await api.delete(`/campaigns/${id}`); setSelected(null); fetchData(); } catch (err) { alert('Error deleting'); }
  };
  const setField = (k, v) => setForm(prev => ({ ...prev, [k]: v }));
  const fmt = (v) => v ? `$${Number(v).toLocaleString()}` : '-';

  if (loading) return <div className="loading-spinner-lg">Loading campaigns...</div>;

  return (
    <div>
      <div className="page-header"><div><h1 className="page-title">Campaigns</h1><p className="page-subtitle">Plan and track marketing campaigns</p></div><button className="btn btn-primary" onClick={openAdd}>+ Add New</button></div>
      <div className="search-bar"><input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="table-container"><table className="data-table"><thead><tr className="table-header"><th>Campaign Name</th><th>Auction</th><th>Type</th><th>Start Date</th><th>End Date</th><th>Budget</th><th>Status</th></tr></thead><tbody>
        {filtered.length === 0 ? <tr><td colSpan="7" className="table-empty">No campaigns found</td></tr> : filtered.map(r => (
          <tr key={r.id} className="table-row" onClick={() => setSelected(r)}>
            <td><strong>{r.campaign_name || '-'}</strong></td><td>Auction #{r.auction_id}</td><td>{r.campaign_type}</td>
            <td>{r.start_date || '-'}</td><td>{r.end_date || '-'}</td><td>{fmt(r.budget)}</td>
            <td><span className={`status-badge ${r.status}`}>{r.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && (<><div className="detail-panel-overlay" onClick={() => setSelected(null)} /><div className="detail-panel">
        <div className="detail-panel-header"><h2>Campaign Details</h2><button className="detail-panel-close" onClick={() => setSelected(null)}>&times;</button></div>
        <div className="detail-panel-body">
          {[['Campaign Name', selected.campaign_name], ['Auction ID', selected.auction_id], ['Campaign Type', selected.campaign_type], ['Target Audience', selected.target_audience], ['Start Date', selected.start_date], ['End Date', selected.end_date], ['Budget', fmt(selected.budget)], ['Status', selected.status], ['Channels', selected.channels], ['Notes', selected.notes]].map(([l, v]) => (
            <div className="detail-field" key={l}><div className="detail-field-label">{l}</div><div className="detail-field-value">{v || '-'}</div></div>
          ))}
        </div>
        <div className="detail-panel-actions"><button className="btn btn-primary" onClick={() => openEdit(selected)}>Edit</button><button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Delete</button></div>
      </div></>)}

      {showModal && (<div className="modal-overlay" onClick={() => setShowModal(false)}><div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><h2>{editing ? 'Edit Campaign' : 'Add Campaign'}</h2><button className="modal-close" onClick={() => setShowModal(false)}>&times;</button></div>
        <form onSubmit={handleSubmit}><div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Campaign Name</label><input className="form-input" value={form.campaign_name} onChange={e => setField('campaign_name', e.target.value)} required /></div>
            <div className="form-group"><label>Auction ID</label><input type="number" className="form-input" value={form.auction_id} onChange={e => setField('auction_id', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Campaign Type</label><select className="form-select" value={form.campaign_type} onChange={e => setField('campaign_type', e.target.value)}><option>Email</option><option>Social Media</option><option>Print</option><option>Digital Ads</option><option>PR</option><option>Direct Mail</option></select></div>
            <div className="form-group"><label>Status</label><select className="form-select" value={form.status} onChange={e => setField('status', e.target.value)}><option value="planned">Planned</option><option value="active">Active</option><option value="completed">Completed</option><option value="paused">Paused</option></select></div>
          </div>
          <div className="form-group"><label>Target Audience</label><input className="form-input" value={form.target_audience} onChange={e => setField('target_audience', e.target.value)} /></div>
          <div className="form-row">
            <div className="form-group"><label>Start Date</label><input type="date" className="form-input" value={form.start_date} onChange={e => setField('start_date', e.target.value)} /></div>
            <div className="form-group"><label>End Date</label><input type="date" className="form-input" value={form.end_date} onChange={e => setField('end_date', e.target.value)} /></div>
          </div>
          <div className="form-group"><label>Budget</label><input type="number" step="0.01" className="form-input" value={form.budget} onChange={e => setField('budget', e.target.value)} /></div>
          <div className="form-group"><label>Channels</label><input className="form-input" value={form.channels} onChange={e => setField('channels', e.target.value)} /></div>
          <div className="form-group"><label>Notes</label><textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} /></div>
        </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button></div></form>
      </div></div>)}
    </div>
  );
}

export default CampaignsPage;
