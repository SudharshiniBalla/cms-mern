import React, { useState, useEffect, useRef } from 'react';
import { mediaAPI } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const formatBytes = (b) => {
  if (!b) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export default function MediaPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useState('grid');
  const fileRef = useRef();

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = typeFilter !== 'all' ? { type: typeFilter } : {};
      const res = await mediaAPI.getAll(params);
      setMedia(res.data.media);
    } catch { toast.error('Failed to load media'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMedia(); }, [typeFilter]);

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', file.name);
        await mediaAPI.upload(formData);
      }
      toast.success(`${files.length} file(s) uploaded`);
      fetchMedia();
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); fileRef.current.value = ''; }
  };

  const handleDelete = async (id) => {
    try {
      await mediaAPI.delete(id);
      toast.success('File deleted');
      setSelected(null);
      fetchMedia();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>Media Library</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{media.length} files</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => setView(v => v === 'grid' ? 'list' : 'grid')} className="btn btn-secondary btn-sm">
            {view === 'grid' ? '📋 List' : '⊞ Grid'}
          </button>
          <button onClick={() => fileRef.current.click()} className="btn btn-primary" disabled={uploading}>
            {uploading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Uploading...</> : '📤 Upload'}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,video/*,.pdf" onChange={handleUpload} style={{ display: 'none' }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'image', 'video', 'document'].map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`btn btn-sm ${typeFilter === t ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}>
            {t === 'all' ? '🗂️ All' : t === 'image' ? '🖼️ Images' : t === 'video' ? '🎬 Videos' : '📄 Documents'}
          </button>
        ))}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const dt = new DataTransfer(); [...e.dataTransfer.files].forEach(f => dt.items.add(f)); fileRef.current.files = dt.files; handleUpload({ target: fileRef.current }); }}
        style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem', transition: 'all 0.2s', cursor: 'pointer', color: 'var(--text-muted)' }}
        onClick={() => fileRef.current.click()}
        onDragEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
        onDragLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>☁️</div>
        <div style={{ fontSize: '0.875rem' }}>Drag & drop files here, or <span style={{ color: 'var(--accent)' }}>click to browse</span></div>
        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Supports images, videos, PDFs (max 50MB)</div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {/* Media Grid/List */}
        <div style={{ flex: 1 }}>
          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : media.length === 0 ? (
            <div className="empty-state"><div className="icon">🖼️</div><h3>No media files</h3><p>Upload your first file</p></div>
          ) : view === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
              {media.map(item => (
                <div
                  key={item._id}
                  onClick={() => setSelected(item)}
                  style={{
                    background: 'var(--bg-card)', border: `1px solid ${selected?._id === item._id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.alt || item.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 120, background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                      {item.type === 'video' ? '🎬' : '📄'}
                    </div>
                  )}
                  <div style={{ padding: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatBytes(item.size)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table>
                <thead><tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th><th></th></tr></thead>
                <tbody>
                  {media.map(item => (
                    <tr key={item._id} onClick={() => setSelected(item)} style={{ cursor: 'pointer', background: selected?._id === item._id ? 'var(--accent-light)' : '' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {item.type === 'image' ? <img src={item.url} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} /> : <div style={{ width: 40, height: 40, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.type === 'video' ? '🎬' : '📄'}</div>}
                          <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{item.name}</div>
                        </div>
                      </td>
                      <td><span className="badge badge-draft" style={{ textTransform: 'capitalize' }}>{item.type}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatBytes(item.size)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{format(new Date(item.createdAt), 'MMM d, yyyy')}</td>
                      <td><button onClick={e => { e.stopPropagation(); handleDelete(item._id); }} className="btn btn-danger btn-sm">🗑️</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ width: 280, flexShrink: 0 }}>
            <div className="card">
              <div style={{ marginBottom: '1rem' }}>
                {selected.type === 'image' ? (
                  <img src={selected.url} alt={selected.alt} style={{ width: '100%', borderRadius: 'var(--radius)', marginBottom: '1rem' }} />
                ) : (
                  <div style={{ width: '100%', height: 120, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', marginBottom: '1rem' }}>
                    {selected.type === 'video' ? '🎬' : '📄'}
                  </div>
                )}
                <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', wordBreak: 'break-all' }}>{selected.name}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <div>Type: <span style={{ color: 'var(--text-primary)' }}>{selected.type}</span></div>
                  <div>Size: <span style={{ color: 'var(--text-primary)' }}>{formatBytes(selected.size)}</span></div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a href={selected.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>🔗 View</a>
                <button onClick={() => handleDelete(selected._id)} className="btn btn-danger btn-sm">🗑️</button>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <input
                  className="form-control"
                  style={{ fontSize: '0.75rem' }}
                  value={selected.url}
                  readOnly
                  onClick={e => { e.target.select(); navigator.clipboard.writeText(selected.url); toast.success('URL copied!'); }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
