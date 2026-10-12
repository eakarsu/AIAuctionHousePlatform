import React, { useState } from 'react';
import Modal from './AIWorkspaceModal';
import AIWorkspace from './AIWorkspace';
import AIResultRenderer from './AIResultRenderer';
import api, { listRows } from '../api';
import features from './aiWorkspaceFeatures.json';
import './AIWorkspace.css';

export default function AIReportLibrary({ floating = false, compact = false }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [nativeOpen, setNativeOpen] = useState(false);
  const [nativeHistory, setNativeHistory] = useState([]);
  const [nativeSelected, setNativeSelected] = useState(null);
  const [nativeLoading, setNativeLoading] = useState(false);
  const [nativeError, setNativeError] = useState('');
  const close = () => { setOpen(false); setSelected(null); setNativeOpen(false); setNativeSelected(null); };
  const loadNativeHistory = async () => {
    setNativeOpen(true); setNativeSelected(null); setNativeLoading(true); setNativeError('');
    try {
      const response = await api.get('/ai/history?limit=100');
      setNativeHistory(listRows(response.data));
    } catch (error) {
      setNativeError(error.response?.data?.error || error.message || 'Saved AI reports could not be loaded.');
    } finally { setNativeLoading(false); }
  };
  const visible = features.filter((feature) => `${feature.title} ${feature.description}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <button type="button" className={`ai-library-launcher ${floating ? 'ai-library-launcher-floating' : ''} ${compact ? 'ai-library-launcher-compact' : ''}`} onClick={() => setOpen(true)}><span aria-hidden="true">✦</span> AI reports <small>{features.length}</small></button>
    {open && <Modal title={selected ? selected.title : nativeOpen ? 'Saved native AI results' : 'AI reports'} className="ai-workspace-dialog" onClose={close} footer={<>{(selected || nativeOpen) && <button type="button" className="btn btn-secondary" onClick={() => { setSelected(null); setNativeOpen(false); setNativeSelected(null); }}>All AI features</button>}<button type="button" className="btn btn-secondary" onClick={close}>Cancel</button></>}>
      {selected ? <AIWorkspace key={selected.id} feature={selected} /> : nativeOpen ? <section className="ai-history"><h2>Saved native AI results</h2>{nativeSelected ? <><button type="button" className="btn btn-secondary" onClick={() => setNativeSelected(null)}>Back to history</button><AIResultRenderer result={{ result: nativeSelected.result }} title={nativeSelected.feature.replace(/-/g, ' ')} /></> : nativeLoading ? <p role="status">Loading saved results…</p> : nativeError ? <div role="alert"><p>{nativeError}</p><button type="button" className="btn btn-secondary" onClick={loadNativeHistory}>Retry</button></div> : nativeHistory.length ? nativeHistory.map((item) => <button type="button" className="ai-history-row" key={item.id} onClick={() => setNativeSelected(item)}><span><strong>{item.prompt_summary || item.feature.replace(/-/g, ' ')}</strong><br /><small>{new Date(item.created_at).toLocaleString()} · {item.feature.replace(/-/g, ' ')}</small></span><span>Open result →</span></button>) : <p>No native AI results have been saved yet.</p>}</section> : <section className="ai-library"><p className="ai-muted">Choose a feature, fill all fields with an example, then generate a professional OpenRouter report. Reports provide recommendations for your review.</p><button type="button" className="btn btn-secondary" onClick={loadNativeHistory}>Saved native AI results</button><label htmlFor="ai-library-search">Find an AI feature</label><input id="ai-library-search" type="search" value={search} placeholder="Search all AI reports…" onChange={(event) => setSearch(event.target.value)} /><div className="ai-library-grid">{visible.map((feature) => <button key={feature.id} className="ai-library-feature" type="button" onClick={() => setSelected(feature)}><strong>{feature.title.replace(/^no\s+/i, '')}</strong><span>Advisory report · 3 complete examples</span><span>Open workspace →</span></button>)}</div>{!visible.length && <p className="ai-muted">No matching features. Try a different search.</p>}</section>}
    </Modal>}
  </>;
}
