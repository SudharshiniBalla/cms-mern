import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    settingsAPI.get()
      .then(r => setSettings(r.data.settings))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await settingsAPI.update(settings);
      setSettings(res.data.settings);
      toast.success('Settings saved!');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const update = (field, value) => setSettings(p => ({ ...p, [field]: value }));
  const updateNested = (parent, field, value) => setSettings(p => ({ ...p, [parent]: { ...p[parent], [field]: value } }));

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!settings) return null;

  const TABS = [
    { id: 'general', label: '⚙️ General' },
    { id: 'seo', label: '🔍 SEO' },
    { id: 'social', label: '📱 Social' },
    { id: 'users', label: '👥 Users' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Configure your CMS platform</p>
        </div>
        <button onClick={handleSave} className="btn btn-primary" disabled={saving}>
          {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save Settings'}
        </button>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-item ${activeTab === t.id ? 'active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>🌐 Site Identity</h3>
            <div className="form-group">
              <label className="form-label">Site Name</label>
              <input className="form-control" value={settings.siteName || ''} onChange={e => update('siteName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Site Description</label>
              <textarea className="form-control" rows={3} value={settings.siteDescription || ''} onChange={e => update('siteDescription', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Site URL</label>
              <input className="form-control" value={settings.siteUrl || ''} onChange={e => update('siteUrl', e.target.value)} placeholder="https://yoursite.com" />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>🎨 Appearance</h3>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Primary Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="color" value={settings.primaryColor || '#3b82f6'} onChange={e => update('primaryColor', e.target.value)} style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', cursor: 'pointer' }} />
                  <input className="form-control" value={settings.primaryColor || ''} onChange={e => update('primaryColor', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Secondary Color</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="color" value={settings.secondaryColor || '#8b5cf6'} onChange={e => update('secondaryColor', e.target.value)} style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-tertiary)', cursor: 'pointer' }} />
                  <input className="form-control" value={settings.secondaryColor || ''} onChange={e => update('secondaryColor', e.target.value)} />
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Posts Per Page</label>
              <input className="form-control" type="number" min={1} max={100} value={settings.postsPerPage || 10} onChange={e => update('postsPerPage', Number(e.target.value))} />
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>🔧 System</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Put site in maintenance mode' },
                { key: 'allowRegistration', label: 'Allow Registration', desc: 'Allow public user registration' },
                { key: 'approvalRequired', label: 'Approval Required', desc: 'Authors must submit for review' },
              ].map(({ key, label, desc }) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', width: 44, height: 24 }}>
                    <input type="checkbox" checked={settings[key] || false} onChange={e => update(key, e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                    <div onClick={() => update(key, !settings[key])} style={{ position: 'absolute', inset: 0, borderRadius: 12, background: settings[key] ? 'var(--accent)' : 'var(--bg-tertiary)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ position: 'absolute', top: 2, left: settings[key] ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>📊 Analytics</h3>
            <div className="form-group">
              <label className="form-label">Google Analytics ID</label>
              <input className="form-control" value={settings.googleAnalyticsId || ''} onChange={e => update('googleAnalyticsId', e.target.value)} placeholder="G-XXXXXXXXXX" />
            </div>
            <div className="form-group">
              <label className="form-label">Facebook Pixel ID</label>
              <input className="form-control" value={settings.facebookPixelId || ''} onChange={e => update('facebookPixelId', e.target.value)} placeholder="XXXXXXXXXXXXXXX" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'seo' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>🔍 Default SEO Settings</h3>
          <div className="form-group">
            <label className="form-label">Default Meta Title</label>
            <input className="form-control" value={settings.defaultMetaTitle || ''} onChange={e => update('defaultMetaTitle', e.target.value)} placeholder="Site Name | Tagline" />
          </div>
          <div className="form-group">
            <label className="form-label">Default Meta Description</label>
            <textarea className="form-control" rows={4} value={settings.defaultMetaDescription || ''} onChange={e => update('defaultMetaDescription', e.target.value)} placeholder="Default description for pages without custom SEO..." />
          </div>
        </div>
      )}

      {activeTab === 'social' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>📱 Social Media Links</h3>
          {[
            { key: 'facebook', label: '👤 Facebook', placeholder: 'https://facebook.com/yourpage' },
            { key: 'twitter', label: '🐦 Twitter/X', placeholder: 'https://twitter.com/yourhandle' },
            { key: 'instagram', label: '📸 Instagram', placeholder: 'https://instagram.com/yourprofile' },
            { key: 'linkedin', label: '💼 LinkedIn', placeholder: 'https://linkedin.com/company/yourcompany' },
            { key: 'youtube', label: '▶️ YouTube', placeholder: 'https://youtube.com/@yourchannel' },
          ].map(({ key, label, placeholder }) => (
            <div className="form-group" key={key}>
              <label className="form-label">{label}</label>
              <input className="form-control" value={settings.socialLinks?.[key] || ''} onChange={e => updateNested('socialLinks', key, e.target.value)} placeholder={placeholder} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card" style={{ maxWidth: 600 }}>
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>👥 User Settings</h3>
          <div className="form-group">
            <label className="form-label">Default User Role</label>
            <select className="form-control" value={settings.defaultUserRole || 'author'} onChange={e => update('defaultUserRole', e.target.value)}>
              {['author', 'editor', 'viewer'].map(r => <option key={r} value={r} style={{ textTransform: 'capitalize' }}>{r}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
