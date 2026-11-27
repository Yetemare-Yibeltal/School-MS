import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const ProfilePage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [tab, setTab] = useState('profile');
  const [busy, setBusy] = useState(false);
  const [p, setP] = useState({
    firstName: user?.firstName || '',
    fatherName: user?.fatherName || '',
    phone: user?.phone || '',
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [show, setShow] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!p.firstName.trim() || !p.fatherName.trim()) {
      toast.error('First and father name are required.');
      return;
    }
    setBusy(true);
    try {
      const res = await api.patch('/auth/me', {
        firstName: p.firstName.trim(),
        fatherName: p.fatherName.trim(),
        phone: p.phone || undefined,
      });
      useAuthStore.setState({ user: { ...user, ...res.data.data.user } });
      toast.success('Profile updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (!pw.currentPassword) return toast.error('Enter your current password.');
    if (!PASSWORD_RE.test(pw.newPassword)) {
      return toast.error(
        'New password needs 8+ characters with upper, lower, number and a symbol (@$!%*?&).'
      );
    }
    if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match.');
    setBusy(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      toast.success('Password changed. Please sign in again.');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
    } finally {
      setBusy(false);
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('photo', file);
    try {
      const res = await api.post('/auth/me/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      useAuthStore.setState({ user: { ...user, photo: res.data.data.photo } });
      toast.success('Photo updated.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Photo upload failed.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="card p-6 flex items-center gap-5">
        <label className="relative w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-700 text-2xl font-bold flex items-center justify-center overflow-hidden cursor-pointer">
          {user?.photo?.url ? (
            <img src={user.photo.url} alt="" className="w-full h-full object-cover" />
          ) : (
            `${user?.firstName?.[0] || ''}${user?.fatherName?.[0] || ''}`
          )}
          <input type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
        </label>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {user?.firstName} {user?.fatherName}
          </h2>
          <p className="text-sm text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          <p className="text-xs text-slate-400">{user?.email}</p>
          <p className="text-xs text-slate-400 mt-1">Click the photo to change it</p>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {[
          ['profile', 'Profile'],
          ['password', 'Password'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${
              tab === id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <form
          onSubmit={saveProfile}
          className="card card-body grid grid-cols-1 md:grid-cols-2 gap-x-4"
        >
          <div className="form-group">
            <label className="form-label">First name</label>
            <input
              className="form-input"
              value={p.firstName}
              onChange={(e) => setP({ ...p, firstName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Father's name</label>
            <input
              className="form-input"
              value={p.fatherName}
              onChange={(e) => setP({ ...p, fatherName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-input"
              placeholder="+251911234567"
              value={p.phone}
              onChange={(e) => setP({ ...p, phone: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input bg-slate-50" value={user?.email || ''} disabled />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      )}

      {tab === 'password' && (
        <form onSubmit={savePassword} className="card card-body">
          {[
            ['currentPassword', 'Current password'],
            ['newPassword', 'New password'],
            ['confirm', 'Confirm new password'],
          ].map(([k, label]) => (
            <div key={k} className="form-group">
              <label className="form-label">{label}</label>
              <input
                type={show ? 'text' : 'password'}
                className="form-input"
                value={pw[k]}
                onChange={(e) => setPw({ ...pw, [k]: e.target.value })}
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm mb-4">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />{' '}
            Show passwords
          </label>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Changing...' : 'Change password'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
