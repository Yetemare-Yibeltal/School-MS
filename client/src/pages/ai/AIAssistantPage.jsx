import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const SUGGESTIONS = [
  'How many active students, teachers and employees do we have?',
  'How many leave applications are pending?',
  'Explain how GPA is calculated with the Ethiopian grading scale.',
  'Give me tips to improve student attendance.',
];

const AIAssistantPage = () => {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.firstName}! I'm the Kat School AI assistant. I know school totals and can help with questions and drafting.`,
    },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  const { data: status } = useQuery({
    queryKey: ['ai-status'],
    queryFn: async () => (await api.get('/ai/status')).data.data,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const ask = useMutation({
    mutationFn: (payload) => api.post('/ai/chatbot', payload),
    onSuccess: (res) =>
      setMessages((m) => [...m, { role: 'assistant', content: res.data.data.response }]),
    onError: (err) =>
      toast.error(err.response?.data?.message || 'The AI assistant is unavailable.'),
  });

  const send = (text) => {
    const msg = (text ?? input).trim();
    if (!msg || ask.isPending) return;
    const history = messages
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-10);
    setMessages((m) => [...m, { role: 'user', content: msg }]);
    setInput('');
    ask.mutate({ message: msg, conversationHistory: history });
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-9rem)] gap-3">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Assistant</h1>
          <p className="page-subtitle">
            {status ? `${status.provider} · ${status.model}` : 'Loading...'}
          </p>
        </div>
        <button
          type="button"
          className="btn-outline btn-sm"
          onClick={() => setMessages(messages.slice(0, 1))}
        >
          Clear
        </button>
      </div>

      {status && !status.configured && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          The AI key is not configured on the server. Set GEMINI_API_KEY in server/.env.
        </div>
      )}

      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs rounded-lg border border-indigo-200 text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="card flex-1 overflow-y-auto p-5 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {ask.isPending && <div className="text-sm text-slate-400">Thinking...</div>}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="card p-3 flex gap-2"
      >
        <textarea
          rows={2}
          className="form-textarea flex-1 resize-none"
          placeholder="Ask something (Enter to send)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
        />
        <button type="submit" className="btn-primary" disabled={ask.isPending || !input.trim()}>
          Send
        </button>
      </form>
      <p className="text-xs text-slate-400 text-center">
        The assistant only sees school totals, never student records. Verify important answers.
      </p>
    </div>
  );
};

export default AIAssistantPage;
