import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Simple Markdown renderer (for demo, use a library like react-markdown for production)
function renderMarkdown(md) {
  // Very basic: headings, bold, italics, code, lists, links
  return md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
    .replace(/\*(.*?)\*/gim, '<i>$1</i>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank">$1</a>');
}

const MarkdownReportsAdmin = () => {
  const [files, setFiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('/api/v1/admin/md-files')
      .then(res => setFiles(res.data.files))
      .catch(() => setFiles([]));
  }, []);

  const handleSelect = (filename) => {
    setSelected(filename);
    setLoading(true);
    setError('');
    setContent('');
    axios.get(`/api/v1/admin/md-files/${encodeURIComponent(filename)}`)
      .then(res => setContent(res.data.content))
      .catch(() => setError('Failed to load file'))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ display: 'flex', minHeight: '80vh' }}>
      <div style={{ minWidth: 220, borderRight: '1px solid #eee', padding: 16 }}>
        <h2>Markdown Reports</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {files.map(f => (
            <li key={f}>
              <button style={{ background: f === selected ? '#eee' : 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%', padding: 4 }} onClick={() => handleSelect(f)}>
                {f}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {loading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {content && (
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        )}
        {!loading && !content && !error && <div>Select a report to view its content.</div>}
      </div>
    </div>
  );
};

export default MarkdownReportsAdmin;
