// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ADD TEACHER PAGE
// kat-school/client/src/pages/teachers/AddTeacherPage.jsx
// ============================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Amharic',
  'History',
  'Geography',
  'Civics',
  'Economics',
  'ICT',
  'Physical Education',
  'Art',
  'Music',
  'Other',
];
const QUALIFICATIONS = ['Certificate', 'Diploma', 'Degree', 'Masters', 'PhD'];
const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Volunteer'];

const FormField = ({ label, required: req, error, hint, className = '', children }) => (
  <div className={`form-group ${className}`}>
    <label className="form-label">
      {label} {req && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="form-error">{error}</p>}
    {hint && !error && <p className="form-hint">{hint}</p>}
  </div>
);

const AddTeacherPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    firstName: '',
    fatherName: '',
    grandFatherName: '',
    gender: '',
    dateOfBirth: '',
    nationality: 'Ethiopian',
    religion: '',
    bloodGroup: '',
    phone: '',
    alternatePhone: '',
    email: '',
    addressRegion: '',
    addressWoreda: '',
    addressKebele: '',
    primarySubject: '',
    secondarySubjects: [],
    gradesCanTeach: [],
    qualification: '',
    fieldOfStudy: '',
    university: '',
    yearOfGraduation: '',
    yearsOfExperience: '0',
    teachingLicenseNumber: '',
    joinDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time',
    isHomeRoomTeacher: false,
    homeRoomSection: '',
    basicSalary: '',
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    tinNumber: '',
    pensionNumber: '',
    nationalIdNumber: '',
    notes: '',
  });

  const { data: sectionsData } = useQuery({
    queryKey: ['sections-all'],
    queryFn: async () => {
      const res = await api.get('/academic/sections');
      return res.data.data.sections;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/teachers', data),
    onSuccess: (res) => {
      const teacher = res.data.data.teacher;
      toast.success(`Teacher created! ID: ${teacher.teacherId}`);
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      queryClient.invalidateQueries({ queryKey: ['teachers-stats'] });
      navigate(`/teachers/${teacher._id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create teacher.');
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
    },
  });

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const toggleArrayField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!form.fatherName.trim()) newErrors.fatherName = "Father's name is required.";
    if (!form.gender) newErrors.gender = 'Gender is required.';
    if (!form.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required.';
    if (!form.phone.trim()) newErrors.phone = 'Phone is required.';
    if (!/^(\+251|251|0)?[79]\d{8}$/.test(form.phone))
      newErrors.phone = 'Enter a valid Ethiopian phone number.';
    if (!form.primarySubject) newErrors.primarySubject = 'Primary subject is required.';
    if (form.gradesCanTeach.length === 0) newErrors.gradesCanTeach = 'Select at least one grade.';
    if (!form.qualification) newErrors.qualification = 'Qualification is required.';
    if (!form.fieldOfStudy.trim()) newErrors.fieldOfStudy = 'Field of study is required.';
    if (!form.joinDate) newErrors.joinDate = 'Join date is required.';
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
      phone: form.phone,
      alternatePhone: form.alternatePhone || undefined,
      email: form.email || undefined,
      address: {
        region: form.addressRegion || undefined,
        woreda: form.addressWoreda || undefined,
        kebele: form.addressKebele || undefined,
      },
      primarySubject: form.primarySubject,
      secondarySubjects: form.secondarySubjects,
      gradesCanTeach: form.gradesCanTeach,
      qualification: form.qualification,
      fieldOfStudy: form.fieldOfStudy,
      university: form.university || undefined,
      yearOfGraduation: form.yearOfGraduation ? parseInt(form.yearOfGraduation) : undefined,
      yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
      teachingLicenseNumber: form.teachingLicenseNumber || undefined,
      joinDate: form.joinDate,
      employmentType: form.employmentType,
      isHomeRoomTeacher: form.isHomeRoomTeacher,
      homeRoomSection:
        form.isHomeRoomTeacher && form.homeRoomSection ? form.homeRoomSection : undefined,
      salary: {
        basicSalary: form.basicSalary ? parseFloat(form.basicSalary) : 0,
        bankName: form.bankName || undefined,
        bankAccountNumber: form.bankAccountNumber || undefined,
        bankBranch: form.bankBranch || undefined,
      },
      tinNumber: form.tinNumber || undefined,
      pensionNumber: form.pensionNumber || undefined,
      nationalIdNumber: form.nationalIdNumber || undefined,
      notes: form.notes || undefined,
    };

    createMutation.mutate(payload);
  };

  const inputClass = (field) => (errors[field] ? 'form-input-error' : 'form-input');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link to="/teachers" className="hover:text-slate-700">
          Teachers
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Add New Teacher</span>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Info */}
        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold">Personal Information</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="First Name" required error={errors.firstName}>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="First name"
                className={inputClass('firstName')}
                autoFocus
              />
            </FormField>
            <FormField label="Father's Name" required error={errors.fatherName}>
              <input
                type="text"
                value={form.fatherName}
                onChange={(e) => updateField('fatherName', e.target.value)}
                placeholder="Father's name"
                className={inputClass('fatherName')}
              />
            </FormField>
            <FormField label="Grandfather's Name">
              <input
                type="text"
                value={form.grandFatherName}
                onChange={(e) => updateField('grandFatherName', e.target.value)}
                placeholder="Optional"
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
            <FormField label="Phone" required error={errors.phone} hint="+251...">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+251911234567"
                className={inputClass('phone')}
              />
            </FormField>
            <FormField label="Alternate Phone" hint="+251...">
              <input
                type="tel"
                value={form.alternatePhone}
                onChange={(e) => updateField('alternatePhone', e.target.value)}
                placeholder="Optional"
                className="form-input"
              />
            </FormField>
            <FormField label="Email" hint="Used for login access">
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="teacher@katschool.edu.et"
                className="form-input"
              />
            </FormField>
          </div>
        </div>

        {/* Professional Info */}
        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold">Professional Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Primary Subject" required error={errors.primarySubject}>
                <select
                  value={form.primarySubject}
                  onChange={(e) => updateField('primarySubject', e.target.value)}
                  className={inputClass('primarySubject')}
                >
                  <option value="">Select primary subject</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Qualification" required error={errors.qualification}>
                <select
                  value={form.qualification}
                  onChange={(e) => updateField('qualification', e.target.value)}
                  className={inputClass('qualification')}
                >
                  <option value="">Select qualification</option>
                  {QUALIFICATIONS.map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Field of Study" required error={errors.fieldOfStudy}>
                <input
                  type="text"
                  value={form.fieldOfStudy}
                  onChange={(e) => updateField('fieldOfStudy', e.target.value)}
                  placeholder="e.g. Mathematics Education"
                  className={inputClass('fieldOfStudy')}
                />
              </FormField>
              <FormField label="University / Institution">
                <input
                  type="text"
                  value={form.university}
                  onChange={(e) => updateField('university', e.target.value)}
                  placeholder="Institution name"
                  className="form-input"
                />
              </FormField>
              <FormField label="Year of Graduation">
                <input
                  type="number"
                  value={form.yearOfGraduation}
                  onChange={(e) => updateField('yearOfGraduation', e.target.value)}
                  min="1970"
                  max={new Date().getFullYear()}
                  placeholder="e.g. 2015"
                  className="form-input"
                />
              </FormField>
              <FormField label="Years of Experience">
                <input
                  type="number"
                  value={form.yearsOfExperience}
                  onChange={(e) => updateField('yearsOfExperience', e.target.value)}
                  min="0"
                  max="50"
                  className="form-input"
                />
              </FormField>
              <FormField label="Teaching License Number">
                <input
                  type="text"
                  value={form.teachingLicenseNumber}
                  onChange={(e) => updateField('teachingLicenseNumber', e.target.value)}
                  placeholder="License number (optional)"
                  className="form-input"
                />
              </FormField>
            </div>

            {/* Grades Can Teach */}
            <FormField label="Grades Can Teach" required error={errors.gradesCanTeach}>
              <div className="flex flex-wrap gap-2 mt-1">
                {GRADES.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleArrayField('gradesCanTeach', grade)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.gradesCanTeach.includes(grade)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </FormField>

            {/* Secondary Subjects */}
            <FormField label="Secondary Subjects (Optional)">
              <div className="flex flex-wrap gap-2 mt-1">
                {SUBJECTS.filter((s) => s !== form.primarySubject).map((subject) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => toggleArrayField('secondarySubjects', subject)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                      form.secondarySubjects.includes(subject)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-purple-400'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </FormField>
          </div>
        </div>

        {/* Employment */}
        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold">Employment Details</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Join Date" required error={errors.joinDate}>
              <input
                type="date"
                value={form.joinDate}
                onChange={(e) => updateField('joinDate', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={inputClass('joinDate')}
              />
            </FormField>
            <FormField label="Employment Type">
              <select
                value={form.employmentType}
                onChange={(e) => updateField('employmentType', e.target.value)}
                className="form-select"
              >
                {EMPLOYMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>

            <div className="col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isHomeRoomTeacher}
                  onChange={(e) => updateField('isHomeRoomTeacher', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm font-medium text-slate-700">
                  Assign as Homeroom Teacher
                </span>
              </label>
            </div>

            {form.isHomeRoomTeacher && (
              <FormField label="Homeroom Section" className="col-span-2">
                <select
                  value={form.homeRoomSection}
                  onChange={(e) => updateField('homeRoomSection', e.target.value)}
                  className="form-select"
                >
                  <option value="">Select section</option>
                  {(sectionsData || []).map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.grade} — Section {s.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </div>
        </div>

        {/* Salary */}
        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold">Salary & Banking</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Basic Salary (ETB)">
              <input
                type="number"
                value={form.basicSalary}
                onChange={(e) => updateField('basicSalary', e.target.value)}
                min="0"
                step="0.01"
                placeholder="Monthly basic salary"
                className="form-input"
              />
            </FormField>
            <FormField label="TIN Number">
              <input
                type="text"
                value={form.tinNumber}
                onChange={(e) => updateField('tinNumber', e.target.value)}
                placeholder="Tax Identification Number"
                className="form-input"
              />
            </FormField>
            <FormField label="Pension Number">
              <input
                type="text"
                value={form.pensionNumber}
                onChange={(e) => updateField('pensionNumber', e.target.value)}
                placeholder="Pension account number"
                className="form-input"
              />
            </FormField>
            <FormField label="Bank Name">
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
                placeholder="e.g. Commercial Bank of Ethiopia"
                className="form-input"
              />
            </FormField>
            <FormField label="Bank Account Number">
              <input
                type="text"
                value={form.bankAccountNumber}
                onChange={(e) => updateField('bankAccountNumber', e.target.value)}
                placeholder="Account number"
                className="form-input"
              />
            </FormField>
            <FormField label="Bank Branch">
              <input
                type="text"
                value={form.bankBranch}
                onChange={(e) => updateField('bankBranch', e.target.value)}
                placeholder="Branch name"
                className="form-input"
              />
            </FormField>
          </div>
        </div>

        {/* Notes */}
        <div className="card mb-5">
          <div className="card-body">
            <FormField label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Additional notes..."
                className="form-textarea"
              />
            </FormField>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between">
          <Link to="/teachers" className="btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? (
              <>
                <div className="spinner-sm" /> Creating Teacher...
              </>
            ) : (
              '✓ Create Teacher'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTeacherPage;
