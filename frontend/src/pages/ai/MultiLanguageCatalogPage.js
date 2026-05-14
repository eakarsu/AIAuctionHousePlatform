import React, { useState } from 'react';
import api from '../../api';
import AIResultRenderer from '../../components/AIResultRenderer';

const ALL_LANGS = [
  'French', 'German', 'Mandarin Chinese', 'Japanese',
  'Italian', 'Spanish', 'Korean', 'Arabic', 'Russian', 'Portuguese',
];

function MultiLanguageCatalogPage() {
  const [lotTitle, setLotTitle] = useState('');
  const [englishDescription, setEnglishDescription] = useState('');
  const [targetLanguages, setTargetLanguages] = useState(
    ['French', 'German', 'Mandarin Chinese']
  );
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleLang = (lang) => {
    setTargetLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/ai/multi-language-catalog', {
        lot_title: lotTitle,
        english_description: englishDescription,
        target_languages: targetLanguages,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Translation failed');
    }
    setLoading(false);
  };

  return (
    <div className="ai-section">
      <div className="page-header">
        <div>
          <h1 className="page-title">Multi-Language Catalog</h1>
          <p className="page-subtitle">Auto-translate lot descriptions for international buyers</p>
        </div>
      </div>
      <div className="ai-form">
        <h3 className="ai-form-title">Source &amp; Target Languages</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Lot Title (English)</label>
            <input className="form-input" value={lotTitle}
              onChange={(e) => setLotTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>English Description</label>
            <textarea className="form-textarea" rows={6}
              value={englishDescription}
              onChange={(e) => setEnglishDescription(e.target.value)}
              placeholder="Paste the English catalog copy you want translated..."
              required />
          </div>
          <div className="form-group">
            <label>Target Languages</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {ALL_LANGS.map((lang) => {
                const active = targetLanguages.includes(lang);
                return (
                  <button type="button" key={lang} onClick={() => toggleLang(lang)}
                    className={active ? 'btn btn-ai' : 'btn'}
                    style={{
                      padding: '6px 12px', fontSize: 13,
                      background: active ? undefined : 'transparent',
                      border: '1px solid #555',
                    }}>{lang}</button>
                );
              })}
            </div>
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn btn-ai"
            disabled={loading || targetLanguages.length === 0}>
            {loading ? 'Translating...' : `Translate to ${targetLanguages.length} languages`}
          </button>
        </form>
      </div>
      {result && <AIResultRenderer result={result} title="Translated Catalog Entries" />}
    </div>
  );
}

export default MultiLanguageCatalogPage;
