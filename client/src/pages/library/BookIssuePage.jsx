import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '-');
const money = (n) => `ETB ${Number(n || 0).toLocaleString()}`;
const bookTitle = (x) =>
  x.bookTitle || (x.book && typeof x.book === 'object' ? x.book.title : '') || '-';
const memberName = (x) =>
  x.memberName ||
  (x.libraryMember && typeof x.libraryMember === 'object'
    ? x.libraryMember.memberName || x.libraryMember.name
    : '') ||
  '-';
const isOverdue = (i) => i.status !== 'returned' && i.dueDate && new Date(i.dueDate) < new Date();

const IssueModal = ({ open, onClose, onDone }) => {
  const [mq, setMq] = useState('');
  const [bq, setBq] = useState('');
  const [member, setMember] = useState(null);
  const [book, setBook] = useState(null);
  const [notes, setNotes] = useState('');

  const { data: members = [] } = useQuery({
    queryKey: ['issue-members', mq],
    queryFn: async () =>
      (await api.get(`/library/members?search=${encodeURIComponent(mq)}&status=active&limit=8`))
        .data.data.members,
    enabled: open && mq.length >= 2 && !member,
  });
  const { data: books = [] } = useQuery({
    queryKey: ['issue-books', bq],
    queryFn: async () =>
      (await api.get(`/library/books?search=${encodeURIComponent(bq)}&isAvailable=true&limit=8`))
        .data.data.books,
    enabled: open && bq.length >= 2 && !book,
  });

  const issue = useMutation({
    mutationFn: (p) => api.post('/library/issues', p),
    onSuccess: (res) => {
      toast.success(res.data.message);
      setMember(null);
      setBook(null);
      setMq('');
      setBq('');
      setNotes('');
      onDone();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not issue book.'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!member || !book) {
      toast.error('Choose a member and a book.');
      return;
    }
    issue.mutate({ book: book._id, libraryMember: member._id, notes: notes || undefined });
  };

  const mLabel = (m) =>
    m.memberName ||
    m.name ||
    (m.student && m.student.firstName ? `${m.student.firstName} ${m.student.fatherName}` : '') ||
    m.membershipId;

  return (
    <Modal open={open} title="Issue book" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-group">
          <label className="form-label">Member</label>
          {member ? (
            <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg text-sm">
              <span>
                {mLabel(member)} <span className="text-slate-500">({member.membershipId})</span>
              </span>
              <button
                type="button"
                className="text-xs text-indigo-600"
                onClick={() => setMember(null)}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                className="form-input"
                placeholder="Search by name or membership ID..."
                value={mq}
                onChange={(e) => setMq(e.target.value)}
              />
              {members.length > 0 && (
                <div className="border rounded-xl mt-1 max-h-40 overflow-y-auto">
                  {members.map((m) => (
                    <button
                      key={m._id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50"
                      onClick={() => setMember(m)}
                    >
                      {mLabel(m)}{' '}
                      <span className="text-xs text-slate-400">
                        {m.membershipId} · {m.memberType}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Book</label>
          {book ? (
            <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg text-sm">
              <span>{book.title}</span>
              <button
                type="button"
                className="text-xs text-indigo-600"
                onClick={() => setBook(null)}
              >
                Change
              </button>
            </div>
          ) : (
            <>
              <input
                className="form-input"
                placeholder="Search available books..."
                value={bq}
                onChange={(e) => setBq(e.target.value)}
              />
              {books.length > 0 && (
                <div className="border rounded-xl mt-1 max-h-40 overflow-y-auto">
                  {books.map((b) => (
                    <button
                      key={b._id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50"
                      onClick={() => setBook(b)}
                    >
                      {b.title}{' '}
                      <span className="text-xs text-slate-400">
                        {b.availableCopies ?? ''} available
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <p className="text-xs text-slate-500 mb-3">
          The due date is set automatically from the member's loan period.
        </p>
        <button type="submit" disabled={issue.isPending} className="btn-primary w-full">
          {issue.isPending ? 'Issuing...' : 'Issue book'}
        </button>
      </form>
    </Modal>
  );
};

const BookIssuePage = () => {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const page = parseInt(params.get('page') || '1', 10);
  const search = params.get('search') || '';
  const status = params.get('status') || '';
  const overdue = params.get('overdue') || '';

  const [issueOpen, setIssueOpen] = useState(false);
  const [ret, setRet] = useState(null);
  const [retForm, setRetForm] = useState({
    returnCondition: '',
    returnRemarks: '',
    payFine: false,
  });
  const [fine, setFine] = useState(null);
  const [fineAmount, setFineAmount] = useState('');
  const [fineBy, setFineBy] = useState('');

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    if (k !== 'page') next.set('page', '1');
    setParams(next);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['book-issues', page, search, status, overdue],
    queryFn: async () => {
      const q = new URLSearchParams({ page, limit: 20 });
      if (search) q.set('search', search);
      if (status) q.set('status', status);
      if (overdue) q.set('overdue', overdue);
      return (await api.get(`/library/issues?${q}`)).data;
    },
    keepPreviousData: true,
  });
  const issues = data?.data?.issues || [];
  const pg = data?.pagination || {};

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['book-issues'] });
    qc.invalidateQueries({ queryKey: ['library-dashboard'] });
    qc.invalidateQueries({ queryKey: ['books'] });
  };

  const doReturn = useMutation({
    mutationFn: ({ id, body }) => api.post(`/library/issues/${id}/return`, body),
    onSuccess: (res) => {
      toast.success(res.data.message);
      refresh();
      setRet(null);
    },
    onError: fail,
  });
  const renew = useMutation({
    mutationFn: ({ id, days }) => api.post(`/library/issues/${id}/renew`, { additionalDays: days }),
    onSuccess: (res) => {
      toast.success(res.data.message);
      refresh();
    },
    onError: fail,
  });
  const payFine = useMutation({
    mutationFn: ({ id, body }) => api.post(`/library/issues/${id}/pay-fine`, body),
    onSuccess: (res) => {
      toast.success(res.data.message);
      refresh();
      setFine(null);
    },
    onError: fail,
  });

  const openReturn = (i) => {
    setRetForm({ returnCondition: '', returnRemarks: '', payFine: false });
    setRet(i);
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Book Issues and Returns</h1>
          <p className="page-subtitle">
            {pg.total ? `${pg.total} issue records` : 'Borrowing records'}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setIssueOpen(true)}>
          Issue Book
        </button>
      </div>

      <div className="card p-4 flex flex-wrap gap-3">
        <input
          type="search"
          className="form-input flex-1 min-w-[200px]"
          placeholder="Search member or book..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
        />
        <select
          className="form-select w-36"
          value={status}
          onChange={(e) => setParam('status', e.target.value)}
        >
          <option value="">All status</option>
          <option value="issued">Issued</option>
          <option value="returned">Returned</option>
          <option value="overdue">Overdue</option>
        </select>
        <select
          className="form-select w-40"
          value={overdue}
          onChange={(e) => setParam('overdue', e.target.value)}
        >
          <option value="">All issues</option>
          <option value="true">Overdue only</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <div className="table-container rounded-none border-0">
          <table className="table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Member</th>
                <th>Issued</th>
                <th>Due</th>
                <th>Returned</th>
                <th>Fine</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && issues.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No issue records
                  </td>
                </tr>
              )}
              {issues.map((i) => {
                const late = isOverdue(i);
                const open = i.status !== 'returned';
                const owed = i.outstandingFine ?? 0;
                return (
                  <tr key={i._id} className={late ? 'bg-red-50/30' : ''}>
                    <td className="font-medium text-slate-900">{bookTitle(i)}</td>
                    <td>{memberName(i)}</td>
                    <td>{fmt(i.issueDate || i.createdAt)}</td>
                    <td className={late ? 'text-red-600 font-semibold' : ''}>
                      {fmt(i.dueDate)}
                      {late && <span className="block text-[10px]">OVERDUE</span>}
                    </td>
                    <td>{fmt(i.returnDate)}</td>
                    <td>
                      {i.fineAmount > 0 ? (
                        <span
                          className={owed > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}
                        >
                          {money(i.fineAmount)}
                          {owed > 0 && (
                            <span className="block text-[10px]">owes {money(owed)}</span>
                          )}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge capitalize ${
                          late
                            ? 'badge-danger'
                            : i.status === 'returned'
                            ? 'badge-success'
                            : 'badge-primary'
                        }`}
                      >
                        {late ? 'overdue' : i.status}
                      </span>
                    </td>
                    <td className="text-right space-x-2 whitespace-nowrap">
                      {open && (
                        <>
                          <button
                            type="button"
                            className="btn-success btn-sm"
                            onClick={() => openReturn(i)}
                          >
                            Return
                          </button>
                          {!late && (
                            <button
                              type="button"
                              className="btn-outline btn-sm"
                              disabled={renew.isPending}
                              onClick={() => renew.mutate({ id: i._id, days: 7 })}
                            >
                              Renew 7d
                            </button>
                          )}
                        </>
                      )}
                      {owed > 0 && (
                        <button
                          type="button"
                          className="btn-outline btn-sm"
                          onClick={() => {
                            setFineAmount(String(owed));
                            setFineBy('');
                            setFine(i);
                          }}
                        >
                          Pay fine
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {pg.totalPages > 1 && (
          <div className="px-5 py-4 border-t flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {page} of {pg.totalPages} ({pg.total} records)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={!pg.hasPreviousPage}
                onClick={() => setParam('page', String(page - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn-outline btn-sm"
                disabled={!pg.hasNextPage}
                onClick={() => setParam('page', String(page + 1))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <IssueModal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        onDone={() => {
          setIssueOpen(false);
          refresh();
        }}
      />

      <Modal open={!!ret} title="Return book" onClose={() => setRet(null)}>
        {ret && (
          <div>
            <p className="text-sm text-slate-600 mb-3">
              {bookTitle(ret)} · {memberName(ret)}
            </p>
            <div className="form-group">
              <label className="form-label">Condition on return (optional)</label>
              <input
                className="form-input"
                list="conditions"
                value={retForm.returnCondition}
                onChange={(e) => setRetForm((p) => ({ ...p, returnCondition: e.target.value }))}
              />
              <datalist id="conditions">
                {['Good', 'Fair', 'Damaged', 'Lost'].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Remarks</label>
              <textarea
                className="form-textarea"
                value={retForm.returnRemarks}
                onChange={(e) => setRetForm((p) => ({ ...p, returnRemarks: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 mb-4 text-sm">
              <input
                type="checkbox"
                className="form-checkbox"
                checked={retForm.payFine}
                onChange={(e) => setRetForm((p) => ({ ...p, payFine: e.target.checked }))}
              />
              Fine paid now (if any)
            </label>
            <button
              type="button"
              className="btn-success w-full"
              disabled={doReturn.isPending}
              onClick={() =>
                doReturn.mutate({
                  id: ret._id,
                  body: {
                    returnCondition: retForm.returnCondition || undefined,
                    returnRemarks: retForm.returnRemarks || undefined,
                    payFine: retForm.payFine,
                  },
                })
              }
            >
              {doReturn.isPending ? 'Saving...' : 'Confirm return'}
            </button>
          </div>
        )}
      </Modal>

      <Modal open={!!fine} title="Pay fine" onClose={() => setFine(null)}>
        {fine && (
          <div>
            <div className="form-group">
              <label className="form-label">Amount (ETB)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={fineAmount}
                onChange={(e) => setFineAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Paid by</label>
              <input
                className="form-input"
                value={fineBy}
                onChange={(e) => setFineBy(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-primary w-full"
              disabled={payFine.isPending}
              onClick={() => {
                const amount = parseFloat(fineAmount);
                if (!amount || amount <= 0) {
                  toast.error('Enter a valid amount.');
                  return;
                }
                payFine.mutate({ id: fine._id, body: { amount, paidBy: fineBy || undefined } });
              }}
            >
              {payFine.isPending ? 'Saving...' : 'Record payment'}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookIssuePage;
