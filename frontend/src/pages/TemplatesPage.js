import React, { useState, useEffect } from 'react';
import { templatesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'blank', 'landing', 'blog', 'portfolio', 'corporate'];

export default function TemplatesPage() {
  const { hasRole } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', category: 'blank', isPublic: true });
  const [saving, setSaving] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = categoryFilter !== 'all' ? { category: categoryFilter } : {};
      const res = await templatesAPI.getAll(params);
      setTemplates(res.data.templates || []);
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [categoryFilter]);

  const openCreate = () => {
    setEditTemplate(null);
    setForm({ name: '', description: '', category: 'blank', isPublic: true });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return toast.error('Template name is required');
    setSaving(true);
    try {
      if (editTemplate) {
        await templatesAPI.update(editTemplate._id, form);
        toast.success('Template updated');
      } else {
        await templatesAPI.create({ ...form, blocks: [] });
        toast.success('Template created');
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await templatesAPI.delete(id);
      toast.success('Template deleted');
      fetch();
    } catch { toast.error('Delete failed'); }
  };

  const categoryIcons = { blank: '⬜', landing: '🚀', blog: '📰', portfolio: '💼', corporate: '🏢', ecommerce: '🛒' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>Templates</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Reusable page templates</p>
        </div>
        {hasRole('admin', 'editor') && (
          <button onClick={openCreate} className="btn btn-primary">+ New Template</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`btn btn-sm ${categoryFilter === c ? 'btn-primary' : 'btn-secondary'}`}
            style={{ textTransform: 'capitalize' }}>
            {categoryIcons[c] || '🏷️'} {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : templates.length === 0 ? (
        <div className="empty-state"><div className="icon">🎨</div><h3>No templates</h3><p>Create your first template</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {templates.map(t => (
            <div key={t._id} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer' }}>
              {t.thumbnail ? (
                <img src={t.thumbnail} alt={t.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: 180, background: 'linear-gradient(135deg, var(--accent-light), var(--purple-light))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                  {categoryIcons[t.category] || '🎨'}
                </div>
              )}
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{t.name}</h3>
                  <span className="badge badge-draft" style={{ textTransform: 'capitalize', flexShrink: 0 }}>{t.category}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>{t.description || 'No description'}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by {t.createdBy?.name}</span>
                  {hasRole('admin', 'editor') && (
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button onClick={() => { setEditTemplate(t); setForm({ name: t.name, description: t.description, category: t.category, isPublic: t.isPublic }); setShowModal(true); }} className="btn btn-ghost btn-sm">✏️</button>
                      <button onClick={() => handleDelete(t._id)} className="btn btn-danger btn-sm">🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editTemplate ? '✏️ Edit Template' : '🎨 New Template'}</h3>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>
            <div className="form-group">
              <label className="form-label">Template Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Product Landing Page" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description of this template..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Visibility</label>
                <select className="form-control" value={form.isPublic} onChange={e => setForm(p => ({ ...p, isPublic: e.target.value === 'true' }))}>
                  <option value="true">Public</option>
                  <option value="false">Private</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : editTemplate ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
