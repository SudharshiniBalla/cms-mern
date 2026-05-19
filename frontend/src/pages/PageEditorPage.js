import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { pagesAPI, templatesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ─── Block Types ──────────────────────────────────────────────
const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: '📰', defaultContent: { text: 'New Heading', level: 2 } },
  { type: 'paragraph', label: 'Paragraph', icon: '📝', defaultContent: { text: 'Add your text here...' } },
  { type: 'image', label: 'Image', icon: '🖼️', defaultContent: { src: '', alt: 'Image' } },
  { type: 'button', label: 'Button', icon: '🔘', defaultContent: { text: 'Click Me', href: '#', variant: 'primary' } },
  { type: 'divider', label: 'Divider', icon: '➖', defaultContent: {} },
  { type: 'columns', label: 'Columns', icon: '🏛️', defaultContent: { columns: [{ text: 'Column 1' }, { text: 'Column 2' }] } },
  { type: 'html', label: 'Custom HTML', icon: '💻', defaultContent: { html: '<p>Custom HTML</p>' } },
  { type: 'cta', label: 'Call to Action', icon: '📣', defaultContent: { title: 'Ready to get started?', subtitle: 'Join thousands of users today.', buttonText: 'Get Started', href: '#' } },
  { type: 'testimonial', label: 'Testimonial', icon: '💬', defaultContent: { quote: 'This is amazing!', author: 'John Doe', role: 'CEO' } },
  { type: 'faq', label: 'FAQ', icon: '❓', defaultContent: { question: 'What is this?', answer: 'This is a great product.' } },
];

// ─── Block Preview Component ──────────────────────────────────
const BlockPreview = ({ block }) => {
  const { type, content, styles = {} } = block;
  const baseStyle = { ...styles };

  switch (type) {
    case 'heading':
      const Tag = `h${content.level || 2}`;
      const sizes = { 1: '2rem', 2: '1.5rem', 3: '1.25rem', 4: '1rem' };
      return <Tag style={{ fontFamily: 'var(--font-display)', fontSize: sizes[content.level || 2], fontWeight: 800, ...baseStyle }}>{content.text}</Tag>;
    case 'paragraph':
      return <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, ...baseStyle }}>{content.text}</p>;
    case 'image':
      return content.src
        ? <img src={content.src} alt={content.alt} style={{ width: '100%', borderRadius: 'var(--radius)', ...baseStyle }} />
        : <div style={{ background: 'var(--bg-tertiary)', border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>🖼️ No image selected</div>;
    case 'button':
      return (
        <div style={{ textAlign: baseStyle.textAlign || 'left' }}>
          <span className={`btn btn-${content.variant || 'primary'}`}>{content.text}</span>
        </div>
      );
    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1rem 0' }} />;
    case 'columns':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${content.columns?.length || 2}, 1fr)`, gap: '1rem' }}>
          {(content.columns || []).map((col, i) => (
            <div key={i} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', padding: '1rem', fontSize: '0.875rem' }}>{col.text}</div>
          ))}
        </div>
      );
    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: content.html }} style={baseStyle} />;
    case 'cta':
      return (
        <div style={{ background: 'linear-gradient(135deg, var(--accent-light), var(--purple-light))', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 'var(--radius-lg)', padding: '2rem', textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>{content.title}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{content.subtitle}</p>
          <span className="btn btn-primary">{content.buttonText}</span>
        </div>
      );
    case 'testimonial':
      return (
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', borderLeft: '3px solid var(--accent)' }}>
          <p style={{ fontStyle: 'italic', marginBottom: '1rem', color: 'var(--text-secondary)' }}>"{content.quote}"</p>
          <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{content.author}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{content.role}</div>
        </div>
      );
    case 'faq':
      return (
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', padding: '1rem' }}>
          <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>❓ {content.question}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{content.answer}</div>
        </div>
      );
    default:
      return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Unknown block type: {type}</div>;
  }
};

// ─── Sortable Block ───────────────────────────────────────────
const SortableBlock = ({ block, isSelected, onSelect, onDelete, onDuplicate }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`canvas-block ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={() => onSelect(block.id)}
    >
      <div style={{ padding: '1rem', pointerEvents: isSelected ? 'none' : 'auto' }}>
        <BlockPreview block={block} />
      </div>
      <div className="block-controls" style={{ display: 'flex' }}>
        <button {...attributes} {...listeners} className="btn btn-ghost btn-icon btn-sm" title="Drag to reorder" style={{ cursor: 'grab' }} onClick={e => e.stopPropagation()}>⠿</button>
        <button onClick={e => { e.stopPropagation(); onDuplicate(block.id); }} className="btn btn-ghost btn-icon btn-sm" title="Duplicate">📋</button>
        <button onClick={e => { e.stopPropagation(); onDelete(block.id); }} className="btn btn-danger btn-icon btn-sm" title="Delete">🗑️</button>
      </div>
    </div>
  );
};

// ─── Block Properties Panel ───────────────────────────────────
const PropertiesPanel = ({ block, onChange }) => {
  if (!block) return (
    <div style={{ padding: '1.5rem', color: 'var(--text-muted)', textAlign: 'center', paddingTop: '3rem' }}>
      <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👆</div>
      <p style={{ fontSize: '0.875rem' }}>Select a block to edit its properties</p>
    </div>
  );

  const update = (field, value) => onChange({ ...block, content: { ...block.content, [field]: value } });
  const updateStyle = (field, value) => onChange({ ...block, styles: { ...block.styles, [field]: value } });

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'capitalize' }}>
        {block.type} Settings
      </div>

      {/* Common style */}
      <div className="form-group">
        <label className="form-label">Text Align</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['left', 'center', 'right'].map(a => (
            <button key={a} onClick={() => updateStyle('textAlign', a)}
              className={`btn btn-sm ${block.styles?.textAlign === a ? 'btn-primary' : 'btn-secondary'}`}>
              {a === 'left' ? '⬅' : a === 'center' ? '↔' : '➡'}
            </button>
          ))}
        </div>
      </div>

      {block.type === 'heading' && <>
        <div className="form-group">
          <label className="form-label">Text</label>
          <input className="form-control" value={block.content.text} onChange={e => update('text', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Level</label>
          <select className="form-control" value={block.content.level} onChange={e => update('level', Number(e.target.value))}>
            {[1,2,3,4].map(l => <option key={l} value={l}>H{l}</option>)}
          </select>
        </div>
      </>}

      {block.type === 'paragraph' && (
        <div className="form-group">
          <label className="form-label">Text</label>
          <textarea className="form-control" rows={5} value={block.content.text} onChange={e => update('text', e.target.value)} />
        </div>
      )}

      {block.type === 'image' && <>
        <div className="form-group">
          <label className="form-label">Image URL</label>
          <input className="form-control" placeholder="https://..." value={block.content.src} onChange={e => update('src', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Alt Text</label>
          <input className="form-control" value={block.content.alt} onChange={e => update('alt', e.target.value)} />
        </div>
      </>}

      {block.type === 'button' && <>
        <div className="form-group">
          <label className="form-label">Button Text</label>
          <input className="form-control" value={block.content.text} onChange={e => update('text', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">URL</label>
          <input className="form-control" value={block.content.href} onChange={e => update('href', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Variant</label>
          <select className="form-control" value={block.content.variant} onChange={e => update('variant', e.target.value)}>
            {['primary', 'secondary', 'ghost', 'danger', 'success'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </>}

      {block.type === 'html' && (
        <div className="form-group">
          <label className="form-label">HTML</label>
          <textarea className="form-control" rows={8} style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={block.content.html} onChange={e => update('html', e.target.value)} />
        </div>
      )}

      {block.type === 'cta' && <>
        <div className="form-group"><label className="form-label">Title</label><input className="form-control" value={block.content.title} onChange={e => update('title', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Subtitle</label><input className="form-control" value={block.content.subtitle} onChange={e => update('subtitle', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Button Text</label><input className="form-control" value={block.content.buttonText} onChange={e => update('buttonText', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Link</label><input className="form-control" value={block.content.href} onChange={e => update('href', e.target.value)} /></div>
      </>}

      {block.type === 'testimonial' && <>
        <div className="form-group"><label className="form-label">Quote</label><textarea className="form-control" rows={3} value={block.content.quote} onChange={e => update('quote', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Author</label><input className="form-control" value={block.content.author} onChange={e => update('author', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Role/Title</label><input className="form-control" value={block.content.role} onChange={e => update('role', e.target.value)} /></div>
      </>}

      {block.type === 'faq' && <>
        <div className="form-group"><label className="form-label">Question</label><input className="form-control" value={block.content.question} onChange={e => update('question', e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Answer</label><textarea className="form-control" rows={4} value={block.content.answer} onChange={e => update('answer', e.target.value)} /></div>
      </>}
    </div>
  );
};

// ─── Main Page Editor ─────────────────────────────────────────
export default function PageEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole, hasPermission } = useAuth();
  const isNew = !id;

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('Untitled Page');
  const [blocks, setBlocks] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('blocks');
  const [seoData, setSeoData] = useState({ title: '', description: '', keywords: [] });
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState('draft');
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    templatesAPI.getAll().then(r => setTemplates(r.data.templates || [])).catch(() => {});
    if (!isNew) {
      pagesAPI.getById(id)
        .then(r => {
          const p = r.data.page;
          setTitle(p.title);
          setBlocks(p.blocks || []);
          setSeoData(p.seo || {});
          setTags((p.tags || []).join(', '));
          setStatus(p.status);
        })
        .catch(() => { toast.error('Failed to load page'); navigate('/pages'); })
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const addBlock = (blockType) => {
    const def = BLOCK_TYPES.find(b => b.type === blockType);
    const newBlock = {
      id: `block_${Date.now()}`,
      type: blockType,
      content: { ...def.defaultContent },
      styles: {},
      order: blocks.length,
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedId(newBlock.id);
  };

  const deleteBlock = (blockId) => {
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (selectedId === blockId) setSelectedId(null);
  };

  const duplicateBlock = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const dup = { ...block, id: `block_${Date.now()}` };
    const idx = blocks.findIndex(b => b.id === blockId);
    const newBlocks = [...blocks];
    newBlocks.splice(idx + 1, 0, dup);
    setBlocks(newBlocks);
  };

  const updateBlock = (updated) => {
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setBlocks(prev => {
        const oldIdx = prev.findIndex(b => b.id === active.id);
        const newIdx = prev.findIndex(b => b.id === over.id);
        return arrayMove(prev, oldIdx, newIdx);
      });
    }
  };

  const applyTemplate = (template) => {
    setBlocks(template.blocks.map(b => ({ ...b, id: `block_${Date.now()}_${Math.random()}` })));
    setShowTemplates(false);
    toast.success(`Template "${template.name}" applied!`);
  };

  const handleSave = async (saveStatus = null) => {
    if (!title.trim()) return toast.error('Page title is required');
    setSaving(true);
    try {
      const payload = {
        title,
        blocks: blocks.map((b, i) => ({ ...b, order: i })),
        seo: seoData,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        status: saveStatus || status,
      };
      if (isNew) {
        const res = await pagesAPI.create(payload);
        toast.success('Page created!');
        navigate(`/pages/${res.data.page._id}/edit`);
      } else {
        await pagesAPI.update(id, payload);
        toast.success('Page saved!');
        if (saveStatus) setStatus(saveStatus);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const selectedBlock = blocks.find(b => b.id === selectedId);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div style={{ margin: '-2rem', height: 'calc(100vh - var(--topbar-h))' }}>
      {/* Editor Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/pages')} className="btn btn-ghost btn-sm">← Back</button>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}
          placeholder="Page title..."
        />
        <span className={`badge badge-${status}`}>{status}</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => handleSave('draft')} className="btn btn-secondary btn-sm" disabled={saving}>Save Draft</button>
          {hasRole('admin', 'editor') ? (
            <button onClick={() => handleSave('published')} className="btn btn-success btn-sm" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '🚀 Publish'}
            </button>
          ) : (
            <button onClick={() => handleSave('pending')} className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '📤 Submit for Review'}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', height: 'calc(100% - 57px)' }}>
        {/* Left Sidebar - Block Palette */}
        <div className="editor-sidebar">
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {['blocks', 'seo'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.8rem', fontWeight: 600, background: activeTab === tab ? 'var(--bg-tertiary)' : 'transparent', color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.2s', textTransform: 'capitalize' }}>
                {tab === 'blocks' ? '🧱 Blocks' : '🔍 SEO'}
              </button>
            ))}
          </div>

          {activeTab === 'blocks' && (
            <div className="block-palette">
              <div style={{ marginBottom: '0.75rem' }}>
                <button onClick={() => setShowTemplates(true)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>🎨 Apply Template</button>
              </div>
              <div className="block-palette-title">Content Blocks</div>
              {BLOCK_TYPES.map(bt => (
                <button key={bt.type} className="block-item" onClick={() => addBlock(bt.type)}>
                  <span>{bt.icon}</span>
                  <span>{bt.label}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '1rem' }}>+</span>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'seo' && (
            <div style={{ padding: '1rem' }}>
              <div className="form-group">
                <label className="form-label">SEO Title</label>
                <input className="form-control" placeholder="Page title for search engines" value={seoData.title || ''} onChange={e => setSeoData(p => ({ ...p, title: e.target.value }))} />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{(seoData.title || '').length}/70</small>
              </div>
              <div className="form-group">
                <label className="form-label">Meta Description</label>
                <textarea className="form-control" rows={3} placeholder="Brief description for search results" value={seoData.description || ''} onChange={e => setSeoData(p => ({ ...p, description: e.target.value }))} />
                <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{(seoData.description || '').length}/160</small>
              </div>
              <div className="form-group">
                <label className="form-label">Keywords (comma-separated)</label>
                <input className="form-control" placeholder="keyword1, keyword2" value={(seoData.keywords || []).join(', ')} onChange={e => setSeoData(p => ({ ...p, keywords: e.target.value.split(',').map(k => k.trim()) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tags</label>
                <input className="form-control" placeholder="tag1, tag2, tag3" value={tags} onChange={e => setTags(e.target.value)} />
              </div>
              <div style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius)', padding: '1rem', marginTop: '1rem' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>SERP Preview</div>
                <div style={{ color: '#8ab4f8', fontSize: '1rem', marginBottom: '0.25rem' }}>{seoData.title || title}</div>
                <div style={{ color: '#6f8285', fontSize: '0.75rem', marginBottom: '0.25rem' }}>yoursite.com/{title.toLowerCase().replace(/\s+/g, '-')}</div>
                <div style={{ color: '#bdc1c6', fontSize: '0.8rem' }}>{seoData.description || 'No description provided'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="editor-canvas" onClick={() => setSelectedId(null)}>
          {blocks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Start building your page</h3>
              <p style={{ fontSize: '0.875rem' }}>Click blocks from the left panel to add them here</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map(block => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    isSelected={selectedId === block.id}
                    onSelect={setSelectedId}
                    onDelete={deleteBlock}
                    onDuplicate={duplicateBlock}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Right Panel - Properties */}
        <div className="editor-properties">
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem' }}>
            ⚙️ Properties
          </div>
          <PropertiesPanel block={selectedBlock} onChange={updateBlock} />
        </div>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="modal-overlay" onClick={() => setShowTemplates(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🎨 Choose a Template</h3>
              <button onClick={() => setShowTemplates(false)} className="btn btn-ghost btn-icon">✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {templates.map(t => (
                <div
                  key={t._id}
                  onClick={() => applyTemplate(t)}
                  style={{ cursor: 'pointer', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {t.thumbnail ? (
                    <img src={t.thumbnail} alt={t.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: 120, background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>🎨</div>
                  )}
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
