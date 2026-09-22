// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// LIBRARY DASHBOARD PAGE
// kat-school/client/src/pages/library/LibraryDashboardPage.jsx
// ============================================

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const LibraryDashboardPage = () => {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['library-dashboard'],
    queryFn: async () => {
      const res = await api.get('/library/dashboard');
      return res.data.data;
    },
  });

  const stats = dashboard?.stats || {};
  const overdueIssues = dashboard?.overdueIssues || [];
  const popularBooks = dashboard?.popularBooks || [];
  const recentIssues = dashboard?.recentIssues || [];
  const categoryStats = dashboard?.categoryStats || [];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Library Dashboard</h1>
          <p className="page-subtitle">Book inventory and borrowing management</p>
        </div>
        <div className="flex gap-2">
          <Link to="/library/issues" className="btn-primary">
            📚 Issue Book
          </Link>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="h-16 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Books',
              value: stats.totalBooks || 0,
              icon: '📚',
              color: '#4f46e5',
              to: '/library/books',
            },
            {
              label: 'Books Issued',
              value: stats.issuedBooks || 0,
              icon: '🔄',
              color: '#7c3aed',
              to: '/library/issues',
            },
            {
              label: 'Available',
              value: (stats.totalBooks || 0) - (stats.issuedBooks || 0),
              icon: '✅',
              color: '#10b981',
              to: '/library/books',
            },
            {
              label: 'Overdue',
              value: stats.overdueBooks || 0,
              icon: '⚠️',
              color: '#ef4444',
              to: '/library/issues?overdue=true',
            },
            {
              label: 'Total Members',
              value: stats.totalMembers || 0,
              icon: '👥',
              color: '#0891b2',
              to: '/library/members',
            },
            {
              label: 'Active Members',
              value: stats.activeMembers || 0,
              icon: '🟢',
              color: '#059669',
              to: '/library/members',
            },
            {
              label: 'Fines Collected',
              value: `ETB ${Number(stats.finesCollected || 0).toLocaleString()}`,
              icon: '💰',
              color: '#f59e0b',
            },
            {
              label: 'Pending Fines',
              value: `ETB ${Number(stats.pendingFines || 0).toLocaleString()}`,
              icon: '⏳',
              color: '#dc2626',
            },
          ].map((stat) =>
            stat.to ? (
              <Link
                key={stat.label}
                to={stat.to}
                className="card p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 truncate">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div key={stat.label} className="card p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 truncate">{stat.value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Books Alert */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold text-red-700">⚠️ Overdue Books</h3>
            <Link to="/library/issues?overdue=true" className="text-xs text-indigo-600">
              View All →
            </Link>
          </div>
          {overdueIssues.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-sm">No overdue books</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {overdueIssues.slice(0, 5).map((issue) => {
                const daysOverdue = Math.floor(
                  (new Date() - new Date(issue.dueDate)) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={issue._id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex-shrink-0 flex items-center justify-center text-red-700 font-bold text-xs">
                      📕
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {issue.bookTitle}
                      </p>
                      <p className="text-xs text-slate-400">{issue.memberName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="badge badge-danger text-xs">{daysOverdue}d late</span>
                      {issue.fineAmount > 0 && (
                        <p className="text-xs text-red-500 mt-0.5">ETB {issue.fineAmount}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Issues */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-sm font-semibold">Recent Issues</h3>
            <Link to="/library/issues" className="text-xs text-indigo-600">
              View All →
            </Link>
          </div>
          {recentIssues.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-sm">No recent issues</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentIssues.map((issue) => (
                <div key={issue._id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex-shrink-0 flex items-center justify-center text-indigo-700 text-sm">
                    📖
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{issue.bookTitle}</p>
                    <p className="text-xs text-slate-400">{issue.memberName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">
                      {new Date(issue.issueDate).toLocaleDateString('en-ET', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                    <span
                      className={`badge text-xs ${
                        issue.status === 'issued'
                          ? 'badge-primary'
                          : issue.status === 'returned'
                          ? 'badge-success'
                          : 'badge-danger'
                      }`}
                    >
                      {issue.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular Books */}
        {popularBooks.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Most Popular Books</h3>
            </div>
            <div className="card-body space-y-3">
              {popularBooks.slice(0, 6).map((book, index) => (
                <div key={book._id} className="flex items-center gap-3">
                  <span className="text-lg font-black text-slate-200 w-6 text-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{book.title}</p>
                    <p className="text-xs text-slate-400">{book.author}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-indigo-600">{book.issueCount}</p>
                    <p className="text-xs text-slate-400">issues</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category Stats */}
        {categoryStats.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h3 className="text-sm font-semibold">Books by Category</h3>
              <Link to="/library/books" className="text-xs text-indigo-600">
                View All →
              </Link>
            </div>
            <div className="card-body space-y-2">
              {categoryStats.slice(0, 8).map((cat) => (
                <div key={cat._id} className="flex items-center gap-3">
                  <span className="text-xs text-slate-600 w-32 truncate">
                    {cat.categoryName || 'Uncategorized'}
                  </span>
                  <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (cat.count / Math.max(...categoryStats.map((c) => c.count))) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-8 text-right">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryDashboardPage;
