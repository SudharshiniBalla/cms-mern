import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', bio: user?.bio || '', avatar: user?.avatar || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleProfileSave = async () => {
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', profile);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async () => {
    if (!passwords.currentPassword || !passwords.newPassword) return toast.error('All fields are required');
    if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPassword(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password changed!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSavingPassword(false); }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const roleColors = { admin: 'var(--purple)', editor: 'var(--accent)', author: 'var(--green)', viewer: 'var(--text-muted)' };
  const roleIcons = { admin: '👑', editor: '✏️', author: '📝', viewer: '👁️' };
  const permLabels = { canPublish: 'Publish Pages', canDelete: 'Delete Pages', canManageUsers: 'Manage Users', canManageSettings: 'Manage Settings' };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>My Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
          {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : initials}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem' }}>{user?.name}</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{user?.email}</div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-tertiary)', border: `1px solid ${roleColors[user?.role]}33`, color: roleColors[user?.role], borderRadius: 20, padding: '0.2rem 0.75rem', fontSize: '0.75rem', fontWeight: 700 }}>
            {roleIcons[user?.role]} {user?.role}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {Object.entries(user?.permissions || {}).map(([perm, enabled]) => (
            <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: enabled ? 'var(--green)' : 'var(--text-muted)' }}>
              <span>{enabled ? '✅' : '❌'}</span>
              <span>{permLabels[perm]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {[{ id: 'profile', label: '👤 Edit Profile' }, { id: 'security', label: '🔒 Security' }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`tab-item ${activeTab === t.id ? 'active' : ''}`}>{t.label}</button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Profile Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-control" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" value={user?.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea className="form-control" rows={3} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell us about yourself..." maxLength={200} />
            <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{profile.bio.length}/200</small>
          </div>
          <div className="form-group">
            <label className="form-label">Avatar URL</label>
            <input className="form-control" value={profile.avatar} onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))} placeholder="https://example.com/avatar.jpg" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleProfileSave} className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '💾 Save Profile'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Change Password</h3>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-control" type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} placeholder="••••••••" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-control" type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-control" type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} placeholder="Repeat new password" />
            </div>
          </div>
          {passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword && (
            <div style={{ color: 'var(--red)', fontSize: '0.8rem', marginBottom: '1rem' }}>⚠️ Passwords do not match</div>
          )}
          {passwords.newPassword && passwords.newPassword.length < 6 && (
            <div style={{ color: 'var(--yellow)', fontSize: '0.8rem', marginBottom: '1rem' }}>⚠️ Password must be at least 6 characters</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handlePasswordSave} className="btn btn-primary" disabled={savingPassword}>
              {savingPassword ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</> : '🔒 Change Password'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
