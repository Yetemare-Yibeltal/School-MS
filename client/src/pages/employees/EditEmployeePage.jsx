import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const QUALIFICATIONS = [
  'No formal education',
  'Primary (Grade 1-8)',
  'Secondary (Grade 9-12)',
  'Certificate',
  'Diploma',
  'Degree',
  'Masters',
  'PhD',
];
const STATUSES = ['active', 'inactive', 'on_leave', 'terminated', 'resigned'];
const PHONE_RE = /^(\+251|251|0)?[79]\d{8}$/;

const Field = ({ label, error, children }) => (
  <div className="form-group">
    <label className="form-label">{label}</label>
    {children}
    {error && <p className="form-error">{error}</p>}
  </div>
);

const EditForm = ({ employee, id }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [errors, setErrors] = useState({});
  const [f, setF] = useState({
    firstName: employee.firstName || '',
    fatherName: employee.fatherName || '',
    grandFatherName: employee.grandFatherName || '',
    gender: employee.gender || '',
    dateOfBirth: employee.dateOfBirth
      ? new Date(employee.dateOfBirth).toISOString().split('T')[0]
      : '',
    phone: employee.phone || '',
    email: employee.email || '',
    qualification: employee.qualification || '',
    fieldOfStudy: employee.fieldOfStudy || '',
    yearsOfExperience: String(employee.yearsOfExperience || 0),
    employmentType: employee.employmentType || 'Full-Time',
    status: employee.status || 'active',
    basicSalary: String(employee.salary?.basicSalary || ''),
  });

  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: null }));
  };
  const cls = (k) => (errors[k] ? 'form-input-error' : 'form-input');

  const update = useMutation({
    mutationFn: (payload) => api.patch(`/employees/${id}`, payload),
    onSuccess: () => {
      toast.success('Employee updated.');
      qc.invalidateQueries({ queryKey: ['employee', id] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      navigate(`/employees/${id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed.'),
  });

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.firstName.trim()) er.firstName = 'Required';
    if (!f.fatherName.trim()) er.fatherName = 'Required';
    if (!PHONE_RE.test(f.phone)) er.phone = 'Enter a valid Ethiopian phone number';
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }
    update.mutate({
      firstName: f.firstName.trim(),
      fatherName: f.fatherName.trim(),
      grandFatherName: f.grandFatherName.trim() || undefined,
      gender: f.gender || undefined,
      dateOfBirth: f.dateOfBirth || undefined,
      phone: f.phone,
      email: f.email || undefined,
      qualification: f.qualification || undefined,
      fieldOfStudy: f.fieldOfStudy || undefined,
      yearsOfExperience: parseInt(f.yearsOfExperience, 10) || 0,
      employmentType: f.employmentType,
      status: f.status,
      salary: { ...(employee.salary || {}), basicSalary: parseFloat(f.basicSalary) || 0 },
    });
  };

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto space-y-5">
      <div className="text-sm text-slate-500">
        <Link to="/employees">Employees</Link> /{' '}
        <Link to={`/employees/${id}`}>
          {employee.firstName} {employee.fatherName}
        </Link>{' '}
        / <b className="text-slate-900">Edit</b>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Employee information</h2>
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Field label="First name" error={errors.firstName}>
            <input
              className={cls('firstName')}
              value={f.firstName}
              onChange={(e) => set('firstName', e.target.value)}
            />
          </Field>
          <Field label="Father's name" error={errors.fatherName}>
            <input
              className={cls('fatherName')}
              value={f.fatherName}
              onChange={(e) => set('fatherName', e.target.value)}
            />
          </Field>
          <Field label="Grandfather's name">
            <input
              className="form-input"
              value={f.grandFatherName}
              onChange={(e) => set('grandFatherName', e.target.value)}
            />
          </Field>
          <Field label="Gender">
            <select
              className="form-select"
              value={f.gender}
              onChange={(e) => set('gender', e.target.value)}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Field>
          <Field label="Date of birth">
            <input
              type="date"
              className="form-input"
              value={f.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
            />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input
              className={cls('phone')}
              value={f.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              className="form-input"
              value={f.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>
          <Field label="Qualification">
            <select
              className="form-select"
              value={f.qualification}
              onChange={(e) => set('qualification', e.target.value)}
            >
              <option value="">Select</option>
              {QUALIFICATIONS.map((q) => (
                <option key={q}>{q}</option>
              ))}
            </select>
          </Field>
          <Field label="Field of study">
            <input
              className="form-input"
              value={f.fieldOfStudy}
              onChange={(e) => set('fieldOfStudy', e.target.value)}
            />
          </Field>
          <Field label="Years of experience">
            <input
              type="number"
              min="0"
              className="form-input"
              value={f.yearsOfExperience}
              onChange={(e) => set('yearsOfExperience', e.target.value)}
            />
          </Field>
          <Field label="Employment type">
            <select
              className="form-select"
              value={f.employmentType}
              onChange={(e) => set('employmentType', e.target.value)}
            >
              {['Full-Time', 'Part-Time', 'Contract', 'Volunteer', 'Intern'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className="form-select"
              value={f.status}
              onChange={(e) => set('status', e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Basic salary (ETB)">
            <input
              type="number"
              min="0"
              className="form-input"
              value={f.basicSalary}
              onChange={(e) => set('basicSalary', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-between">
        <Link to={`/employees/${id}`} className="btn-outline">
          Cancel
        </Link>
        <button type="submit" disabled={update.isPending} className="btn-primary">
          {update.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  );
};

const EditEmployeePage = () => {
  const { id } = useParams();
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get(`/employees/${id}`)).data.data.employee,
  });

  if (isLoading) {
    return <div className="card p-8 text-center text-slate-400">Loading...</div>;
  }
  if (!employee) {
    return (
      <div className="card p-10 text-center">
        <p className="text-slate-500">Employee not found.</p>
        <Link to="/employees" className="btn-primary mt-4 inline-flex">
          Back to employees
        </Link>
      </div>
    );
  }
  return <EditForm employee={employee} id={id} />;
};

export default EditEmployeePage;
