// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// EDIT STUDENT PAGE
// kat-school/client/src/pages/students/EditStudentPage.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const RELIGIONS = ['Orthodox', 'Muslim', 'Protestant', 'Catholic', 'Traditional', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUSES = ['active', 'inactive', 'graduated', 'transferred', 'expelled', 'suspended'];

const FormField = ({ label, required: req, error, hint, children }) => (
  <div className="form-group">
    <label className="form-label">
      {label} {req && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="form-error">{error}</p>}
    {hint && !error && <p className="form-hint">{hint}</p>}
  </div>
);

const EditStudentPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState(null);

  // ─── Fetch Student ───────────────────────────
  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      const res = await api.get(`/students/${id}`);
      return res.data.data.student;
    },
  });

  // Populate form when student loads
  useEffect(() => {
    if (student && !form) {
      setForm({
        firstName: student.firstName || '',
        fatherName: student.fatherName || '',
        grandFatherName: student.grandFatherName || '',
        gender: student.gender || '',
        dateOfBirth: student.dateOfBirth
          ? new Date(student.dateOfBirth).toISOString().split('T')[0]
          : '',
        nationality: student.nationality || 'Ethiopian',
        religion: student.religion || '',
        bloodGroup: student.bloodGroup || '',
        grade: student.grade || '',
        section: student.section?._id || student.section || '',
        status: student.status || 'active',
        rollNumber: student.rollNumber || '',
        phone: student.phone || '',
        email: student.email || '',
        addressRegion: student.address?.region || '',
        addressWoreda: student.address?.woreda || '',
        addressKebele: student.address?.kebele || '',
        addressHouseNumber: student.address?.houseNumber || '',
        addressLocation: student.address?.specificLocation || '',
        hasDisability: student.medicalInfo?.hasDisability || false,
        disabilityDescription: student.medicalInfo?.disabilityDescription || '',
        allergies: (student.medicalInfo?.allergies || []).join(', '),
        medicalNotes: student.medicalInfo?.medicalNotes || '',
        notes: student.notes || '',
      });
    }
  }, [student, form]);

  // ─── Fetch Sections ───────────────────────────
  const { data: sectionsData } = useQuery({
    queryKey: ['sections', form?.grade],
    queryFn: async () => {
      const res = await api.get(`/academic/sections?grade=${form.grade}`);
      return res.data.data.sections;
    },
    enabled: !!form?.grade,
  });

  // ─── Update Mutation ──────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`/students/${id}`, data),
    onSuccess: () => {
      toast.success('Student updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      navigate(`/students/${id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Update failed.');
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
    },
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!form.fatherName.trim()) newErrors.fatherName = "Father's name is required.";
    if (!form.gender) newErrors.gender = 'Gender is required.';
    if (!form.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required.';
    if (!form.grade) newErrors.grade = 'Grade is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      firstName: form.firstName.trim(),
      fatherName: form.fatherName.trim(),
      grandFatherName: form.grandFatherName.trim() || undefined,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      nationality: form.nationality,
      religion: form.religion || undefined,
      bloodGroup: form.bloodGroup || undefined,
      grade: form.grade,
      section: form.section || null,
      status: form.status,
      rollNumber: form.rollNumber ? parseInt(form.rollNumber) : undefined,
      phone: form.phone || undefined,
      email: form.email || undefined,
      address: {
        region: form.addressRegion || undefined,
        woreda: form.addressWoreda || undefined,
        kebele: form.addressKebele || undefined,
        houseNumber: form.addressHouseNumber || undefined,
        specificLocation: form.addressLocation || undefined,
      },
      medicalInfo: {
        hasDisability: form.hasDisability,
        disabilityDescription: form.hasDisability ? form.disabilityDescription : undefined,
        allergies: form.allergies
          ? form.allergies
              .split(',')
              .map((a) => a.trim())
              .filter(Boolean)
          : [],
        medicalNotes: form.medicalNotes || undefined,
      },
      notes: form.notes || undefined,
    };

    updateMutation.mutate(payload);
  };

  if (isLoading || !form) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-8 bg-slate-100 rounded w-48 mb-5 animate-pulse" />
        <div className="card p-8 animate-pulse">
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-slate-100 rounded w-24" />
                <div className="h-10 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const inputClass = (field) => (errors[field] ? 'form-input-error' : 'form-input');

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link to="/students" className="hover:text-slate-700">
          Students
        </Link>
        <span>/</span>
        <Link to={`/students/${id}`} className="hover:text-slate-700">
          {student?.firstName} {student?.fatherName}
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Edit</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold text-slate-900">Personal Information</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="First Name" required error={errors.firstName}>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className={inputClass('firstName')}
              />
            </FormField>
            <FormField label="Father's Name" required error={errors.fatherName}>
              <input
                type="text"
                value={form.fatherName}
                onChange={(e) => updateField('fatherName', e.target.value)}
                className={inputClass('fatherName')}
              />
            </FormField>
            <FormField label="Grandfather's Name" error={errors.grandFatherName}>
              <input
                type="text"
                value={form.grandFatherName}
                onChange={(e) => updateField('grandFatherName', e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Gender" required error={errors.gender}>
              <select
                value={form.gender}
                onChange={(e) => updateField('gender', e.target.value)}
                className={inputClass('gender')}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </FormField>
            <FormField label="Date of Birth" required error={errors.dateOfBirth}>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={inputClass('dateOfBirth')}
              />
            </FormField>
            <FormField label="Nationality">
              <input
                type="text"
                value={form.nationality}
                onChange={(e) => updateField('nationality', e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Religion">
              <select
                value={form.religion}
                onChange={(e) => updateField('religion', e.target.value)}
                className="form-select"
              >
                <option value="">Select (optional)</option>
                {RELIGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Blood Group">
              <select
                value={form.bloodGroup}
                onChange={(e) => updateField('bloodGroup', e.target.value)}
                className="form-select"
              >
                <option value="">Select (optional)</option>
                {BLOOD_GROUPS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Phone" hint="+251...">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="form-input"
              />
            </FormField>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold text-slate-900">Academic Information</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Grade" required error={errors.grade}>
              <select
                value={form.grade}
                onChange={(e) => {
                  updateField('grade', e.target.value);
                  updateField('section', '');
                }}
                className={inputClass('grade')}
              >
                <option value="">Select grade</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Section">
              <select
                value={form.section}
                onChange={(e) => updateField('section', e.target.value)}
                className="form-select"
              >
                <option value="">No section</option>
                {(sectionsData || []).map((s) => (
                  <option key={s._id} value={s._id}>
                    Section {s.name} ({s.currentEnrollment}/{s.capacity})
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Roll Number">
              <input
                type="number"
                value={form.rollNumber}
                onChange={(e) => updateField('rollNumber', e.target.value)}
                min="1"
                className="form-input"
              />
            </FormField>
            <FormField label="Status" error={errors.status}>
              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="form-select"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold text-slate-900">Address</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Region">
              <input
                type="text"
                value={form.addressRegion}
                onChange={(e) => updateField('addressRegion', e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Woreda">
              <input
                type="text"
                value={form.addressWoreda}
                onChange={(e) => updateField('addressWoreda', e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Kebele">
              <input
                type="text"
                value={form.addressKebele}
                onChange={(e) => updateField('addressKebele', e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="House Number">
              <input
                type="text"
                value={form.addressHouseNumber}
                onChange={(e) => updateField('addressHouseNumber', e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Specific Location" className="col-span-2">
              <input
                type="text"
                value={form.addressLocation}
                onChange={(e) => updateField('addressLocation', e.target.value)}
                className="form-input"
              />
            </FormField>
          </div>
        </div>

        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold text-slate-900">Medical & Notes</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasDisability}
                  onChange={(e) => updateField('hasDisability', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm font-medium text-slate-700">Has a disability</span>
              </label>
            </div>
            {form.hasDisability && (
              <FormField label="Disability Description" className="col-span-2">
                <textarea
                  value={form.disabilityDescription}
                  onChange={(e) => updateField('disabilityDescription', e.target.value)}
                  className="form-textarea"
                />
              </FormField>
            )}
            <FormField label="Allergies" hint="Comma-separated">
              <input
                type="text"
                value={form.allergies}
                onChange={(e) => updateField('allergies', e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Medical Notes">
              <textarea
                value={form.medicalNotes}
                onChange={(e) => updateField('medicalNotes', e.target.value)}
                className="form-textarea"
              />
            </FormField>
            <FormField label="General Notes" className="col-span-2">
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                className="form-textarea"
              />
            </FormField>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Link to={`/students/${id}`} className="btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
            {updateMutation.isPending ? (
              <>
                <div className="spinner-sm" /> Saving...
              </>
            ) : (
              '✓ Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditStudentPage;
