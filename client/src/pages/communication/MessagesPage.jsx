import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import { useAuthStore } from '../../store/authStore';

const idOf = (v) => (v && typeof v === 'object' ? v._id || v.id : v);
const userName = (u) =>
  u && typeof u === 'object' ? `${u.firstName || ''} ${u.fatherName || ''}`.trim() : '';
const threadTitle = (t, myId) => {
  const others = (t.participants || []).filter((p) => idOf(p.user || p) !== myId);
  const names = others.map((p) => userName(p.user || p)).filter(Boolean);
  return t.displayName || names.join(', ') || t.subject || 'Conversation';
};
const when = (d) =>
  d
    ? new Date(d).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const MessagesPage = () => {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const myId = user?._id || user?.id;
  const [active, setActive] = useState(null);
  const [text, setText] = useState('');
  const [compose, setCompose] = useState(false);
  const [q, setQ] = useState('');
  const [to, setTo] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const endRef = useRef(null);

  const { data: inbox, isLoading } = useQuery({
    queryKey: ['inbox'],
    queryFn: async () => (await api.get('/communications/messages/inbox')).data.data,
    refetchInterval: 30000,
  });
  const threads = inbox?.threads || [];

  const { data: thread } = useQuery({
    queryKey: ['thread', active],
    queryFn: async () =>
      (await api.get(`/communications/messages/thread/${active}?limit=100`)).data.data,
    enabled: !!active,
    refetchInterval: 15000,
  });
  const messages = thread?.messages || [];

  const { data: people = [] } = useQuery({
    queryKey: ['message-people', q],
    queryFn: async () =>
      (await api.get(`/directory/users?search=${encodeURIComponent(q)}&limit=8`)).data.data.users,
    enabled: compose && q.length >= 2 && !to,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const fail = (err) => toast.error(err.response?.data?.message || 'Request failed.');
  const reply = useMutation({
    mutationFn: ({ id, content }) =>
      api.post(`/communications/messages/thread/${id}/reply`, { content }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['thread', active] });
      qc.invalidateQueries({ queryKey: ['inbox'] });
    },
    onError: fail,
  });
  const send = useMutation({
    mutationFn: (p) => api.post('/communications/messages/send', p),
    onSuccess: (res) => {
      toast.success('Message sent.');
      setCompose(false);
      setTo(null);
      setQ('');
      setSubject('');
      setBody('');
      qc.invalidateQueries({ queryKey: ['inbox'] });
      const t = res.data.data?.thread;
      if (t?._id) setActive(t._id);
    },
    onError: fail,
  });
  const del = useMutation({
    mutationFn: (id) => api.delete(`/communications/messages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['thread', active] }),
    onError: fail,
  });

  const submitReply = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    reply.mutate({ id: active, content: text.trim() });
  };
  const submitCompose = (e) => {
    e.preventDefault();
    if (!to || !body.trim()) {
      toast.error('Choose a recipient and write a message.');
      return;
    }
    send.mutate({
      recipientId: to._id,
      subject: subject.trim() || 'No subject',
      content: body.trim(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">
            {inbox?.unreadCount ? `${inbox.unreadCount} unread` : 'Your conversations'}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setCompose(true)}>
          New message
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:h-[calc(100vh-14rem)]">
        <div className="card overflow-y-auto divide-y divide-slate-100">
          {isLoading && <p className="p-6 text-center text-slate-400">Loading...</p>}
          {!isLoading && threads.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">No messages yet.</p>
          )}
          {threads.map((t) => (
            <button
              key={t._id}
              type="button"
              onClick={() => setActive(t._id)}
              className={`w-full text-left p-4 hover:bg-slate-50 ${
                active === t._id ? 'bg-indigo-50' : ''
              }`}
            >
              <div className="flex justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {threadTitle(t, myId)}
                </p>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                  {when(t.lastMessageAt || t.updatedAt)}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">{t.subject}</p>
              <p className="text-xs text-slate-400 truncate">
                {t.lastMessagePreview || t.lastMessage || ''}
              </p>
            </button>
          ))}
        </div>

        <div className="card md:col-span-2 flex flex-col min-h-[320px]">
          {!active && (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              Select a conversation
            </div>
          )}
          {active && (
            <>
              <div className="px-5 py-3 border-b">
                <p className="font-semibold text-slate-900">
                  {thread?.displayName || thread?.thread?.subject || 'Conversation'}
                </p>
                <p className="text-xs text-slate-400">{thread?.thread?.subject}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {messages.map((m) => {
                  const mine = idOf(m.sender) === myId;
                  return (
                    <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[75%]">
                        {!mine && (
                          <p className="text-xs text-slate-400 mb-0.5">
                            {userName(m.sender) || m.senderName}
                          </p>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                            mine ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {m.isDeleted ? 'Message deleted' : m.content}
                        </div>
                        <p
                          className={`text-[10px] text-slate-400 mt-0.5 ${
                            mine ? 'text-right' : ''
                          }`}
                        >
                          {when(m.createdAt)}
                          {mine && !m.isDeleted && (
                            <button
                              type="button"
                              className="ml-2 text-red-400"
                              onClick={() =>
                                window.confirm('Delete this message?') && del.mutate(m._id)
                              }
                            >
                              delete
                            </button>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <form onSubmit={submitReply} className="p-4 border-t flex gap-2">
                <textarea
                  rows={2}
                  className="form-textarea flex-1 resize-none"
                  placeholder="Type a reply (Enter to send)"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitReply(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={reply.isPending || !text.trim()}
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <Modal open={compose} title="New message" onClose={() => setCompose(false)}>
        <form onSubmit={submitCompose}>
          <div className="form-group">
            <label className="form-label">To</label>
            {to ? (
              <div className="flex items-center justify-between p-2 bg-indigo-50 rounded-lg text-sm">
                <span>
                  {userName(to)}{' '}
                  <span className="text-slate-500 capitalize">({to.role?.replace('_', ' ')})</span>
                </span>
                <button
                  type="button"
                  className="text-xs text-indigo-600"
                  onClick={() => setTo(null)}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                <input
                  className="form-input"
                  placeholder="Search by name..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q.length >= 2 && people.length === 0 && (
                  <p className="text-xs text-slate-400 mt-1">No matching users.</p>
                )}
                {people.length > 0 && (
                  <div className="border rounded-xl mt-1 max-h-40 overflow-y-auto">
                    {people.map((p) => (
                      <button
                        key={p._id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50"
                        onClick={() => setTo(p)}
                      >
                        {userName(p)}{' '}
                        <span className="text-xs text-slate-400 capitalize">
                          {p.role?.replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              className="form-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              rows={5}
              className="form-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <button type="submit" disabled={send.isPending} className="btn-primary w-full">
            {send.isPending ? 'Sending...' : 'Send message'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default MessagesPage;
