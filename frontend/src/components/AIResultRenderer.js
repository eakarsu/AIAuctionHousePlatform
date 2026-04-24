import React from 'react';

function renderValue(value, depth = 0) {
  if (value === null || value === undefined) return <span className="ai-val-null">N/A</span>;
  if (typeof value === 'boolean') return <span className={`status-badge ${value ? 'active' : 'pending'}`}>{value ? 'Yes' : 'No'}</span>;
  if (typeof value === 'number') return <span className="ai-val-number">{value.toLocaleString()}</span>;
  if (typeof value === 'string') {
    if (value.length > 200) {
      return <p className="ai-val-text">{value}</p>;
    }
    return <span>{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="ai-val-null">None</span>;
    if (typeof value[0] === 'string' || typeof value[0] === 'number') {
      return (
        <ul className="ai-result-list">
          {value.map((item, i) => <li key={i}>{String(item)}</li>)}
        </ul>
      );
    }
    return (
      <div className="ai-nested-array">
        {value.map((item, i) => (
          <div key={i} className="ai-array-item">
            {typeof item === 'object' ? renderObject(item, depth + 1) : <span>{String(item)}</span>}
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return renderObject(value, depth + 1);
  }
  return <span>{String(value)}</span>;
}

function renderObject(obj, depth = 0) {
  if (!obj || typeof obj !== 'object') return null;
  return (
    <div className={`ai-object-fields ${depth > 0 ? 'ai-nested' : ''}`}>
      {Object.entries(obj).map(([key, val]) => {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const isLongText = typeof val === 'string' && val.length > 100;
        const isArrayOrObj = Array.isArray(val) || (typeof val === 'object' && val !== null);

        if (isLongText || isArrayOrObj) {
          return (
            <div key={key} className="ai-result-section">
              <div className="ai-result-section-title">{label}</div>
              <div className="ai-result-section-body">{renderValue(val, depth)}</div>
            </div>
          );
        }

        return (
          <div key={key} className="ai-result-highlight">
            <strong>{label}:</strong> {renderValue(val, depth)}
          </div>
        );
      })}
    </div>
  );
}

function parseContent(raw) {
  if (!raw) return null;

  // Try to parse as JSON
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    // Check if it looks like JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed);
      } catch (e) { /* not JSON, treat as text */ }
    }
    // Try to extract JSON from markdown code blocks
    const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e) { /* not JSON */ }
    }
  }

  if (typeof raw === 'object') return raw;
  return null;
}

function parseTextSections(text) {
  if (!text) return [];
  const str = String(text);
  const lines = str.split('\n');
  const sections = [];
  let currentSection = { title: '', content: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isHeader = (
      (trimmed.endsWith(':') && trimmed.length < 80 && !trimmed.includes(',') && !/^\d/.test(trimmed)) ||
      /^#{1,3}\s/.test(trimmed) ||
      /^\*\*[^*]+\*\*:?$/.test(trimmed) ||
      /^[A-Z][A-Z\s&]{3,}:?$/.test(trimmed)
    );

    if (isHeader) {
      if (currentSection.title || currentSection.content.length > 0) sections.push({ ...currentSection });
      currentSection = { title: trimmed.replace(/^#{1,3}\s/, '').replace(/\*\*/g, '').replace(/:$/, '').trim(), content: [] };
    } else {
      const isBullet = /^[-*•]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed);
      const clean = trimmed.replace(/^[-*•]\s+/, '').replace(/^\d+[.)]\s+/, '').replace(/\*\*([^*]+)\*\*/g, '$1');
      currentSection.content.push({ type: isBullet ? 'bullet' : 'text', text: clean });
    }
  }
  if (currentSection.title || currentSection.content.length > 0) sections.push(currentSection);
  return sections;
}

function AIResultRenderer({ result, title }) {
  if (!result) return null;

  // Extract the actual content
  let content = result;
  if (result.result !== undefined) content = result.result;
  else if (result.data !== undefined) content = result.data;

  // Try to parse as structured JSON
  const parsed = parseContent(content);

  return (
    <div className="ai-result">
      <div className="ai-result-header">
        <span style={{ fontSize: '1.3rem' }}>✨</span>
        <h3>{title || 'AI Analysis Result'}</h3>
      </div>
      <div className="ai-result-content">
        {parsed ? (
          // Render structured JSON beautifully
          renderObject(parsed)
        ) : (
          // Render as formatted text
          (() => {
            const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
            const sections = parseTextSections(text);
            if (sections.length === 0) return <div className="ai-result-text">{text}</div>;
            return sections.map((section, idx) => (
              <div className="ai-result-section" key={idx}>
                {section.title && <div className="ai-result-section-title">{section.title}</div>}
                {section.content.filter(c => c.type === 'text').length > 0 && (
                  <div className="ai-result-text">
                    {section.content.filter(c => c.type === 'text').map((t, i) => {
                      if (t.text.includes(':') && t.text.indexOf(':') < 40) {
                        const [key, ...rest] = t.text.split(':');
                        return <div className="ai-result-highlight" key={i}><strong>{key.trim()}:</strong> {rest.join(':').trim()}</div>;
                      }
                      return <p key={i} style={{ marginBottom: '8px' }}>{t.text}</p>;
                    })}
                  </div>
                )}
                {section.content.filter(c => c.type === 'bullet').length > 0 && (
                  <ul className="ai-result-list">
                    {section.content.filter(c => c.type === 'bullet').map((b, i) => <li key={i}>{b.text}</li>)}
                  </ul>
                )}
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
}

export default AIResultRenderer;
