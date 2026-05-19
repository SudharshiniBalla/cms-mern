import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pagesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const StatusBadge = ({ status }) => (
  <span className={`badge badge-${status}`}>{status}</span>
);

const STATUSES = ['all', 'published', 'draft', 'pending', 'archived'];

export default function PagesListPage() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 10 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (search) params.search = search;
      const res = await pagesAPI.getAll(params);
      setPages(res.data.pages);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchPages, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchPages]);

  const handleDelete = async (id) => {
    try {
      await pagesAPI.delete(id);
      toast.success('Page deleted');
      setDeleteId(null);
      fetchPages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleApprove = async (id) => {
    try {
      await pagesAPI.approve(id);
      toast.success('Page approved and published!');
      fetchPages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await pagesAPI.duplicate(id);
      toast.success('Page duplicated!');
      fetchPages();
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 800 }}>Pages</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.25rem' }}>{total} total pages</p>
        </div>
        <button onClick={() => navigate('/pages/new')} className="btn btn-primary">+ New Page</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
          <span>🔍</span>
          <input
            placeholder="Search pages..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
              className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="page-loader" style={{ minHeight: 300 }}><div className="spinner" /></div>
        ) : pages.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📄</div>
            <h3>No pages found</h3>
            <p>{search ? 'Try a different search term' : 'Create your first page'}</p>
            {!search && <button onClick={() => navigate('/pages/new')} className="btn btn-primary" style={{ marginTop: '1rem' }}>Create Page</button>}
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Author</th>
                  <th>Updated</th>
                  <th>Views</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <tr key={page._id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{page.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/{page.slug}</div>
                    </td>
                    <td><StatusBadge status={page.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="avatar" style={{ width: 24, height: 24, fontSize: '0.65rem' }}>
                          {page.author?.name?.[0]?.toUpperCase()}
                        </div>
                        {page.author?.name}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{page.viewCount || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button onClick={() => navigate(`/pages/${page._id}/edit`)} className="btn btn-ghost btn-sm" title="Edit">✏️</button>
                        {page.status === 'pending' && hasRole('admin', 'editor') && (
                          <button onClick={() => handleApprove(page._id)} className="btn btn-success btn-sm" title="Approve">✅</button>
                        )}
                        <button onClick={() => handleDuplicate(page._id)} className="btn btn-ghost btn-sm" title="Duplicate">📋</button>
                        <button onClick={() => setDeleteId(page._id)} className="btn btn-danger btn-sm" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>←</button>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
            <button key={n} className={`page-btn ${n === currentPage ? 'active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
          ))}
          <button className="page-btn" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>→</button>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🗑️ Delete Page</h3>
              <button onClick={() => setDeleteId(null)} className="btn btn-ghost btn-icon">✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Are you sure you want to delete this page? This action cannot be undone.
            </p>
            <div className="modal-footer">
              <button onClick={() => setDeleteId(null)} className="btn btn-secondary">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="btn btn-danger">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
