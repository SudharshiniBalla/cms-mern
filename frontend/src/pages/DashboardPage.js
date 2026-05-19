import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { analyticsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>{status}</span>
);

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasRole('admin', 'editor')) {
      analyticsAPI.getDashboard()
        .then(res => setStats(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const chartData = stats?.analyticsData?.map(d => ({
    date: format(new Date(d.date), 'MMM d'),
    views: d.views || 0,
  })) || [];

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '0.25rem' }}>
            Good {new Date().getHours() < 12 ? 'morning' : 'afternoon'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <button onClick={() => navigate('/pages/new')} className="btn btn-primary">
          + Create Page
        </button>
      </div>

      {/* Stats Grid */}
      {hasRole('admin', 'editor') && stats && (
        <div className="stat-grid">
          <div className="stat-card blue">
            <div className="stat-label">Total Pages</div>
            <div className="stat-value">{stats.stats.totalPages}</div>
            <div className="stat-icon">📄</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Published</div>
            <div className="stat-value">{stats.stats.publishedPages}</div>
            <div className="stat-icon">✅</div>
          </div>
          <div className="stat-card yellow">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value">{stats.stats.pendingPages}</div>
            <div className="stat-icon">⏳</div>
          </div>
          <div className="stat-card red">
            <div className="stat-label">Drafts</div>
            <div className="stat-value">{stats.stats.draftPages}</div>
            <div className="stat-icon">📝</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: hasRole('admin', 'editor') ? '1fr 1fr' : '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Chart */}
        {hasRole('admin', 'editor') && chartData.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📈 Page Views (30 days)</h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)' }} />
                <Line type="monotone" dataKey="views" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Pages */}
        {hasRole('admin', 'editor') && stats?.topPages?.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">🔥 Top Pages</h3>
            </div>
            <div>
              {stats.topPages.map((page, i) => (
                <div key={page._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: i < stats.topPages.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/{page.slug}</div>
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{page.viewCount} views</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Pages */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">🕒 Recent Activity</h3>
          <button onClick={() => navigate('/pages')} className="btn btn-ghost btn-sm">View all →</button>
        </div>
        {stats?.recentPages?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Last Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPages.map(page => (
                  <tr key={page._id}>
                    <td style={{ fontWeight: 500 }}>{page.title}</td>
                    <td><StatusBadge status={page.status} /></td>
                    <td style={{ color: 'var(--text-muted)' }}>{page.author?.name}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td>
                      <button onClick={() => navigate(`/pages/${page._id}/edit`)} className="btn btn-ghost btn-sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="icon">📄</div>
            <h3>No pages yet</h3>
            <p>Create your first page to get started</p>
            <button onClick={() => navigate('/pages/new')} className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Page</button>
          </div>
        )}
      </div>
    </div>
  );
}
