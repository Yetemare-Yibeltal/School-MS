import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TYPES = [
  'exam_schedule',
  'fee_reminder',
  'holiday_notice',
  'parent_meeting',
  'event_announcement',
  'health_safety',
  'general',
];
const TONES = ['formal', 'friendly', 'urgent', 'informative'];
const LANGS = [
  ['english', 'English'],
  ['amharic', 'Amharic'],
  ['both', 'English and Amharic'],
];
const AUDIENCES = ['all', 'students', 'parents', 'teachers', 'employees'];

const AINoticePage = () => {
  const qc = useQueryClient();
  const [f, setF] = useState({
    noticeType: 'general',
    tone: 'formal',
    language: 'english',
    targetAudience: 'all',
    keyPoints: '',
    additionalContext: '',
  });
  const [draft, setDraft] = useState(null);
  const [pub, setPub] = useState({ category: 'General', priority: 'medium' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const generate = useMutation({
    mutationFn: () =>
      api.post('/ai/notice-writer', { ...f, additionalContext: f.additionalContext || undefined }),
    onSuccess: (res) => {
      setDraft(res.data.data);
      toast.success('Draft generated. Review it before publishing.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Generation failed.'),
  });

  const publish = useMutation({
    mutationFn: () =>
      api.post('/communications/notices', {
        title: draft.title,
        content: draft.amharicContent
          ? `${draft.content}\n\n${draft.amharicTitle || ''}\n${draft.amharicContent}`
          : draft.content,
        category: pub.category,
        priority: pub.priority,
        targetAudience: [f.targetAudience],
        sendNotification: true,
        isAIGenerated: true,
      }),
    onSuccess: () => {
      toast.success('Notice published.');
      qc.invalidateQueries({ queryKey: ['notices'] });
      setDraft(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Publish failed.'),
  });

  const edit = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Notice Writer</h1>
          <p className="page-subtitle">Draft a notice, edit it, then publish</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <form
          className="card card-body"
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.keyPoints.trim()) return toast.error('Add the key points first.');
            generate.mutate();
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="form-select" value={f.noticeType} onChange={set('noticeType')}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tone</label>
              <select className="form-select" value={f.tone} onChange={set('tone')}>
                {TONES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Language</label>
              <select className="form-select" value={f.language} onChange={set('language')}>
                {LANGS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Audience</label>
              <select
                className="form-select"
                value={f.targetAudience}
                onChange={set('targetAudience')}
              >
                {AUDIENCES.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Key points</label>
            <textarea
              rows={5}
              className="form-textarea"
              placeholder="One point per line: dates, places, what to bring..."
              value={f.keyPoints}
              onChange={set('keyPoints')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Extra context (optional)</label>
            <textarea
              rows={2}
              className="form-textarea"
              value={f.additionalContext}
              onChange={set('additionalContext')}
            />
          </div>
          <button type="submit" disabled={generate.isPending} className="btn-primary w-full">
            {generate.isPending ? 'Generating...' : 'Generate notice'}
          </button>
        </form>

        <div className="card card-body">
          {!draft && (
            <p className="text-center text-slate-400 py-16 text-sm">Your draft will appear here.</p>
          )}
          {draft && (
            <>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={draft.title || ''} onChange={edit('title')} />
              </div>
              <div className="form-group">
                <label className="form-label">Content</label>
                <textarea
                  rows={8}
                  className="form-textarea"
                  value={draft.content || ''}
                  onChange={edit('content')}
                />
              </div>
              {draft.amharicContent && (
                <div className="form-group">
                  <label className="form-label">Amharic</label>
                  <textarea
                    rows={5}
                    className="form-textarea"
                    value={draft.amharicContent}
                    onChange={edit('amharicContent')}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    className="form-input"
                    value={pub.category}
                    onChange={(e) => setPub({ ...pub, category: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={pub.priority}
                    onChange={(e) => setPub({ ...pub, priority: e.target.value })}
                  >
                    {['low', 'medium', 'high', 'urgent'].map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                AI drafts can contain mistakes. Check dates and details before publishing.
              </p>
              <button
                type="button"
                className="btn-success w-full"
                disabled={publish.isPending}
                onClick={() => publish.mutate()}
              >
                {publish.isPending ? 'Publishing...' : 'Publish notice'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AINoticePage;
