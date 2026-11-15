import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../services/api';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Brother',
  'Sister',
  'Uncle',
  'Aunt',
  'Guardian',
  'Other',
];
const PHONE_RE = /^(\+251|251|0)?[79]\d{8}$/;
const today = () => new Date().toISOString().split('T')[0];

const Field = ({ label, error, required, children }) => (
  <div className="form-group">
    <label className="form-label">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="form-error">{error}</p>}
  </div>
);

const AddStudentPage = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [errors, setErrors] = useState({});
  const [f, setF] = useState({
    firstName: '',
    fatherName: '',
    grandFatherName: '',
    gender: '',
    dateOfBirth: '',
    nationality: 'Ethiopian',
    phone: '',
    email: '',
    grade: '',
    section: '',
    academicYear: '',
    admissionDate: today(),
    admissionType: 'New',
    previousSchool: '',
    guardianName: '',
    guardianRelationship: 'Father',
    guardianPhone: '',
    guardianEmail: '',
    region: '',
    woreda: '',
    kebele: '',
    allergies: '',
    medicalNotes: '',
    notes: '',
  });

  const set = (k, v) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: null }));
  };
  const cls = (k) => (errors[k] ? 'form-input-error' : 'form-input');

  const { data: years } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => (await api.get('/academic/years')).data.data.academicYears,
  });

  const { data: sections } = useQuery({
    queryKey: ['sections', f.grade],
    queryFn: async () => (await api.get(`/academic/sections?grade=${f.grade}`)).data.data.sections,
    enabled: !!f.grade,
  });

  const create = useMutation({
    mutationFn: (payload) => api.post('/students', payload),
    onSuccess: (res) => {
      const s = res.data.data.student;
      toast.success(`Student created: ${s.studentId}`);
      qc.invalidateQueries({ queryKey: ['students'] });
      navigate(`/students/${s._id}`);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Could not create student.'),
  });

  const submit = (e) => {
    e.preventDefault();
    const er = {};
    if (!f.firstName.trim()) er.firstName = 'Required';
    if (!f.fatherName.trim()) er.fatherName = 'Required';
    if (!f.gender) er.gender = 'Required';
    if (!f.dateOfBirth) er.dateOfBirth = 'Required';
    if (!f.grade) er.grade = 'Required';
    if (!f.academicYear) er.academicYear = 'Required';
    if (!f.guardianName.trim()) er.guardianName = 'Required';
    if (!PHONE_RE.test(f.guardianPhone)) er.guardianPhone = 'Enter a valid Ethiopian phone number';
    setErrors(er);
    if (Object.keys(er).length) {
      return;
    }

    create.mutate({
      firstName: f.firstName.trim(),
      fatherName: f.fatherName.trim(),
      grandFatherName: f.grandFatherName.trim() || undefined,
      gender: f.gender,
      dateOfBirth: f.dateOfBirth,
      nationality: f.nationality,
      phone: f.phone || undefined,
      email: f.email || undefined,
      grade: f.grade,
      section: f.section || undefined,
      academicYear: f.academicYear,
      admissionDate: f.admissionDate,
      admissionType: f.admissionType,
      previousSchool: f.previousSchool || undefined,
      address: {
        region: f.region || undefined,
        woreda: f.woreda || undefined,
        kebele: f.kebele || undefined,
      },
      primaryGuardian: {
        name: f.guardianName.trim(),
        relationship: f.guardianRelationship,
        phone: f.guardianPhone,
        email: f.guardianEmail || undefined,
        isEmergencyContact: true,
      },
      medicalInfo: {
        allergies: f.allergies
          ? f.allergies
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        medicalNotes: f.medicalNotes || undefined,
      },
      notes: f.notes || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="max-w-3xl mx-auto space-y-5">
      <div className="text-sm text-slate-500">
        <Link to="/students">Students</Link> / <b className="text-slate-900">Add student</b>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Personal information</h2>
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Field label="First name" required error={errors.firstName}>
            <input
              className={cls('firstName')}
              value={f.firstName}
              onChange={(e) => set('firstName', e.target.value)}
            />
          </Field>
          <Field label="Father's name" required error={errors.fatherName}>
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
          <Field label="Gender" required error={errors.gender}>
            <select
              className={cls('gender')}
              value={f.gender}
              onChange={(e) => set('gender', e.target.value)}
            >
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Field>
          <Field label="Date of birth" required error={errors.dateOfBirth}>
            <input
              type="date"
              max={today()}
              className={cls('dateOfBirth')}
              value={f.dateOfBirth}
              onChange={(e) => set('dateOfBirth', e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <input
              className="form-input"
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
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Academic information</h2>
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Field label="Academic year" required error={errors.academicYear}>
            <select
              className={cls('academicYear')}
              value={f.academicYear}
              onChange={(e) => set('academicYear', e.target.value)}
            >
              <option value="">Select</option>
              {(years || []).map((y) => (
                <option key={y._id} value={y._id}>
                  {y.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Grade" required error={errors.grade}>
            <select
              className={cls('grade')}
              value={f.grade}
              onChange={(e) => {
                set('grade', e.target.value);
                set('section', '');
              }}
            >
              <option value="">Select</option>
              {GRADES.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </Field>
          <Field label="Section">
            <select
              className="form-select"
              value={f.section}
              onChange={(e) => set('section', e.target.value)}
              disabled={!f.grade}
            >
              <option value="">Assign later</option>
              {(sections || []).map((s) => (
                <option key={s._id} value={s._id}>
                  Section {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Admission date">
            <input
              type="date"
              className="form-input"
              value={f.admissionDate}
              onChange={(e) => set('admissionDate', e.target.value)}
            />
          </Field>
          <Field label="Admission type">
            <select
              className="form-select"
              value={f.admissionType}
              onChange={(e) => set('admissionType', e.target.value)}
            >
              <option>New</option>
              <option>Transfer</option>
              <option>Re-admission</option>
            </select>
          </Field>
          <Field label="Previous school">
            <input
              className="form-input"
              value={f.previousSchool}
              onChange={(e) => set('previousSchool', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Guardian</h2>
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Field label="Guardian name" required error={errors.guardianName}>
            <input
              className={cls('guardianName')}
              value={f.guardianName}
              onChange={(e) => set('guardianName', e.target.value)}
            />
          </Field>
          <Field label="Relationship">
            <select
              className="form-select"
              value={f.guardianRelationship}
              onChange={(e) => set('guardianRelationship', e.target.value)}
            >
              {RELATIONSHIPS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Guardian phone" required error={errors.guardianPhone}>
            <input
              className={cls('guardianPhone')}
              value={f.guardianPhone}
              placeholder="+251911234567"
              onChange={(e) => set('guardianPhone', e.target.value)}
            />
          </Field>
          <Field label="Guardian email">
            <input
              type="email"
              className="form-input"
              value={f.guardianEmail}
              onChange={(e) => set('guardianEmail', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="font-bold">Address and medical</h2>
        </div>
        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-x-4">
          <Field label="Region">
            <input
              className="form-input"
              value={f.region}
              onChange={(e) => set('region', e.target.value)}
            />
          </Field>
          <Field label="Woreda">
            <input
              className="form-input"
              value={f.woreda}
              onChange={(e) => set('woreda', e.target.value)}
            />
          </Field>
          <Field label="Kebele">
            <input
              className="form-input"
              value={f.kebele}
              onChange={(e) => set('kebele', e.target.value)}
            />
          </Field>
          <Field label="Allergies (comma separated)">
            <input
              className="form-input"
              value={f.allergies}
              onChange={(e) => set('allergies', e.target.value)}
            />
          </Field>
          <Field label="Medical notes">
            <textarea
              className="form-textarea"
              value={f.medicalNotes}
              onChange={(e) => set('medicalNotes', e.target.value)}
            />
          </Field>
          <Field label="Notes">
            <textarea
              className="form-textarea"
              value={f.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="flex justify-between">
        <Link to="/students" className="btn-outline">
          Cancel
        </Link>
        <button type="submit" disabled={create.isPending} className="btn-primary">
          {create.isPending ? 'Saving...' : 'Create student'}
        </button>
      </div>
    </form>
  );
};

export default AddStudentPage;
