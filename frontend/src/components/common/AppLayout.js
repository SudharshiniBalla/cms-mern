import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NavItem = ({ to, icon, label, badge }) => (
  <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
    <span>{icon}</span>
    <span>{label}</span>
    {badge && <span className="badge">{badge}</span>}
  </NavLink>
);

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">C</div>
          <span className="logo-text">ContentCMS</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Overview</div>
            <NavItem to="/dashboard" icon="📊" label="Dashboard" />
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Content</div>
            <NavItem to="/pages" icon="📄" label="Pages" />
            <NavItem to="/media" icon="🖼️" label="Media Library" />
            <NavItem to="/templates" icon="🎨" label="Templates" />
          </div>

          {hasRole('admin', 'editor') && (
            <div className="nav-section">
              <div className="nav-section-label">Management</div>
              {hasRole('admin') && <NavItem to="/users" icon="👥" label="Users" />}
              {hasRole('admin') && <NavItem to="/settings" icon="⚙️" label="Settings" />}
            </div>
          )}

          <div className="nav-section">
            <div className="nav-section-label">Account</div>
            <NavItem to="/profile" icon="👤" label="Profile" />
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-icon btn-sm"
              title="Logout"
            >🚪</button>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ display: 'none' }}
        >☰</button>
        <div className="topbar-title">ContentCMS</div>
        <div className="topbar-actions">
          <button
            onClick={() => navigate('/pages/new')}
            className="btn btn-primary btn-sm"
          >+ New Page</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="page-content animate-in">
          <Outlet />
        </div>
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
        />
      )}
    </div>
  );
}
