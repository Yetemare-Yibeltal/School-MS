import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TYPES = ['Government', 'Private', 'Non-Governmental', 'Religious'];
const LEVELS = ['Primary', 'Secondary', 'Primary & Secondary'];
const FIELDS = [
  'schoolName',
  'schoolNameAmharic',
  'schoolCode',
  'schoolMotto',
  'schoolType',
  'schoolLevel',
  'schoolAddress',
  'schoolRegion',
  'schoolWoreda',
  'schoolKebele',
  'schoolPhone',
  'schoolAlternatePhone',
  'schoolEmail',
  'schoolWebsite',
  'primaryColor',
  'secondaryColor',
];

const Text = ({ label, value, onChange, type = 'text' }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    <input type={type} className="form-input" value={value || ''} onChange={onChange} />
  </div>
);

const SettingsForm = ({ settings }) => {
  const qc = useQueryClient();
  const [f, setF] = useState(() => Object.fromEntries(FIELDS.map((k) => [k, settings[k] ?? ''])));
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(settings.logoUrl || '');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = useMutation({
    mutationFn: (p) => api.patch('/system/settings', p),
    onSuccess: () => {
      toast.success('Settings saved.');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not save settings.'),
  });
  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('logo', logo);
      return api.post('/system/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      toast.success('Logo uploaded.');
      setPreview(res.data.data.logo.url);
      setLogo(null);
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed.'),
  });

  const submit = (e) => {
    e.preventDefault();
    if (!f.schoolName.trim()) {
      toast.error('School name is required.');
      return;
    }
    const payload = {};
    FIELDS.forEach((k) => {
      if (f[k] !== '') payload[k] = f[k];
    });
    save.mutate(payload);
  };

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="page-subtitle">School profile shown on reports and receipts</p>
        </div>
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving...' : 'Save settings'}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Logo</h3>
        </div>
        <div className="card-body flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
            {preview ? (
              <img src={preview} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xs text-slate-400">No logo</span>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              className="text-xs"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  setLogo(file);
                  setPreview(URL.createObjectURL(file));
                }
              }}
            />
            {logo && (
              <button
                type="button"
                className="btn-outline btn-sm mt-2"
                disabled={upload.isPending}
                onClick={() => upload.mutate()}
              >
                {upload.isPending ? 'Uploading...' : 'Upload logo'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">School information</h3>
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Text label="School name" value={f.schoolName} onChange={set('schoolName')} />
          <Text
            label="School name (Amharic)"
            value={f.schoolNameAmharic}
            onChange={set('schoolNameAmharic')}
          />
          <Text label="School code" value={f.schoolCode} onChange={set('schoolCode')} />
          <Text label="Motto" value={f.schoolMotto} onChange={set('schoolMotto')} />
          <div className="form-group">
            <label className="form-label">School type</label>
            <select className="form-select" value={f.schoolType} onChange={set('schoolType')}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">School level</label>
            <select className="form-select" value={f.schoolLevel} onChange={set('schoolLevel')}>
              {LEVELS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Contact</h3>
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Text label="Address" value={f.schoolAddress} onChange={set('schoolAddress')} />
          <Text label="Region" value={f.schoolRegion} onChange={set('schoolRegion')} />
          <Text label="Woreda" value={f.schoolWoreda} onChange={set('schoolWoreda')} />
          <Text label="Kebele" value={f.schoolKebele} onChange={set('schoolKebele')} />
          <Text label="Phone" value={f.schoolPhone} onChange={set('schoolPhone')} />
          <Text
            label="Alternate phone"
            value={f.schoolAlternatePhone}
            onChange={set('schoolAlternatePhone')}
          />
          <Text label="Email" type="email" value={f.schoolEmail} onChange={set('schoolEmail')} />
          <Text label="Website" value={f.schoolWebsite} onChange={set('schoolWebsite')} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="text-sm font-semibold">Branding</h3>
        </div>
        <div className="card-body grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Primary colour</label>
            <input
              type="color"
              className="w-full h-10 rounded-lg border border-slate-300"
              value={f.primaryColor || '#4f46e5'}
              onChange={set('primaryColor')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Secondary colour</label>
            <input
              type="color"
              className="w-full h-10 rounded-lg border border-slate-300"
              value={f.secondaryColor || '#7c3aed'}
              onChange={set('secondaryColor')}
            />
          </div>
        </div>
      </div>
    </form>
  );
};

const SettingsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => (await api.get('/system/settings')).data.data.settings,
  });
  if (isLoading) return <div className="card p-8 text-center text-slate-400">Loading...</div>;
  if (!data)
    return <div className="card p-8 text-center text-slate-500">Could not load settings.</div>;
  return <SettingsForm settings={data} />;
};

export default SettingsPage;
