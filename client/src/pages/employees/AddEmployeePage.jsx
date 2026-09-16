// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ADD EMPLOYEE PAGE
// kat-school/client/src/pages/employees/AddEmployeePage.jsx
// ============================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';

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
const EMPLOYMENT_TYPES = ['Full-Time', 'Part-Time', 'Contract', 'Volunteer', 'Intern'];
const RELATIONSHIPS = [
  'Father',
  'Mother',
  'Spouse',
  'Brother',
  'Sister',
  'Uncle',
  'Aunt',
  'Friend',
  'Other',
];
const MARITAL_STATUSES = ['Single', 'Married', 'Divorced', 'Widowed'];

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

const AddEmployeePage = () => {
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
    maritalStatus: '',
    numberOfDependents: '0',
    phone: '',
    alternatePhone: '',
    email: '',
    addressRegion: '',
    addressWoreda: '',
    addressKebele: '',
    addressHouseNumber: '',
    addressLocation: '',
    emergencyName: '',
    emergencyRelationship: 'Spouse',
    emergencyPhone: '',
    department: '',
    designation: '',
    qualification: '',
    fieldOfStudy: '',
    university: '',
    yearsOfExperience: '0',
    joinDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time',
    contractEndDate: '',
    basicSalary: '',
    housingAllowance: '0',
    transportAllowance: '0',
    medicalAllowance: '0',
    otherAllowances: '0',
    bankName: '',
    bankAccountNumber: '',
    bankBranch: '',
    tinNumber: '',
    pensionNumber: '',
    nationalIdNumber: '',
    notes: '',
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments-list'],
    queryFn: async () => {
      const res = await api.get('/hrm/departments');
      return res.data.data.departments;
    },
  });

  const { data: designationsData } = useQuery({
    queryKey: ['designations', form.department],
    queryFn: async () => {
      const res = await api.get(`/hrm/designations?department=${form.department}`);
      return res.data.data.designations;
    },
    enabled: !!form.department,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/employees', data),
    onSuccess: (res) => {
      const employee = res.data.data.employee;
      toast.success(`Employee created! ID: ${employee.employeeId}`);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employees-stats'] });
      navigate(`/employees/${employee._id}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create employee.');
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
    if (!form.phone.trim()) newErrors.phone = 'Phone is required.';
    if (!/^(\+251|251|0)?[79]\d{8}$/.test(form.phone))
      newErrors.phone = 'Enter a valid Ethiopian phone number.';
    if (!form.department) newErrors.department = 'Department is required.';
    if (!form.designation) newErrors.designation = 'Designation is required.';
    if (!form.qualification) newErrors.qualification = 'Qualification is required.';
    if (!form.joinDate) newErrors.joinDate = 'Join date is required.';
    if (!form.basicSalary) newErrors.basicSalary = 'Basic salary is required.';
    if (!form.emergencyName.trim()) newErrors.emergencyName = 'Emergency contact name is required.';
    if (!form.emergencyPhone.trim())
      newErrors.emergencyPhone = 'Emergency contact phone is required.';
    if (!/^(\+251|251|0)?[79]\d{8}$/.test(form.emergencyPhone))
      newErrors.emergencyPhone = 'Enter a valid phone.';
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
      maritalStatus: form.maritalStatus || undefined,
      numberOfDependents: parseInt(form.numberOfDependents) || 0,
      phone: form.phone,
      alternatePhone: form.alternatePhone || undefined,
      email: form.email || undefined,
      address: {
        region: form.addressRegion || undefined,
        woreda: form.addressWoreda || undefined,
        kebele: form.addressKebele || undefined,
        houseNumber: form.addressHouseNumber || undefined,
        specificLocation: form.addressLocation || undefined,
      },
      emergencyContact: {
        name: form.emergencyName.trim(),
        relationship: form.emergencyRelationship,
        phone: form.emergencyPhone,
        alternatePhone: undefined,
        address: undefined,
      },
      department: form.department,
      designation: form.designation,
      qualification: form.qualification,
      fieldOfStudy: form.fieldOfStudy || undefined,
      university: form.university || undefined,
      yearsOfExperience: parseInt(form.yearsOfExperience) || 0,
      joinDate: form.joinDate,
      employmentType: form.employmentType,
      contractEndDate: form.contractEndDate || undefined,
      salary: {
        basicSalary: parseFloat(form.basicSalary) || 0,
        housingAllowance: parseFloat(form.housingAllowance) || 0,
        transportAllowance: parseFloat(form.transportAllowance) || 0,
        medicalAllowance: parseFloat(form.medicalAllowance) || 0,
        otherAllowances: parseFloat(form.otherAllowances) || 0,
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
        <Link to="/employees" className="hover:text-slate-700">
          Employees
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-medium">Add New Employee</span>
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
            <FormField label="Marital Status">
              <select
                value={form.maritalStatus}
                onChange={(e) => updateField('maritalStatus', e.target.value)}
                className="form-select"
              >
                <option value="">Select (optional)</option>
                {MARITAL_STATUSES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Number of Dependents">
              <input
                type="number"
                value={form.numberOfDependents}
                onChange={(e) => updateField('numberOfDependents', e.target.value)}
                min="0"
                max="20"
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
            <FormField label="Alternate Phone">
              <input
                type="tel"
                value={form.alternatePhone}
                onChange={(e) => updateField('alternatePhone', e.target.value)}
                placeholder="Optional"
                className="form-input"
              />
            </FormField>
            <FormField label="Email" hint="Used for system login">
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="employee@example.com"
                className="form-input"
              />
            </FormField>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold">Emergency Contact</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Contact Name"
              required
              error={errors.emergencyName}
              className="col-span-2"
            >
              <input
                type="text"
                value={form.emergencyName}
                onChange={(e) => updateField('emergencyName', e.target.value)}
                placeholder="Full name"
                className={inputClass('emergencyName')}
              />
            </FormField>
            <FormField label="Relationship" required error={errors.emergencyRelationship}>
              <select
                value={form.emergencyRelationship}
                onChange={(e) => updateField('emergencyRelationship', e.target.value)}
                className="form-select"
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Phone" required error={errors.emergencyPhone} hint="+251...">
              <input
                type="tel"
                value={form.emergencyPhone}
                onChange={(e) => updateField('emergencyPhone', e.target.value)}
                placeholder="+251..."
                className={inputClass('emergencyPhone')}
              />
            </FormField>
          </div>
        </div>

        {/* Employment */}
        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold">Employment Information</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Department" required error={errors.department}>
              <select
                value={form.department}
                onChange={(e) => {
                  updateField('department', e.target.value);
                  updateField('designation', '');
                }}
                className={inputClass('department')}
              >
                <option value="">Select department</option>
                {(departmentsData || []).map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Designation" required error={errors.designation}>
              <select
                value={form.designation}
                onChange={(e) => updateField('designation', e.target.value)}
                disabled={!form.department}
                className={inputClass('designation')}
              >
                <option value="">Select designation</option>
                {(designationsData || []).map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
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
            <FormField label="Field of Study">
              <input
                type="text"
                value={form.fieldOfStudy}
                onChange={(e) => updateField('fieldOfStudy', e.target.value)}
                placeholder="e.g. Accounting"
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
            {form.employmentType === 'Contract' && (
              <FormField label="Contract End Date">
                <input
                  type="date"
                  value={form.contractEndDate}
                  onChange={(e) => updateField('contractEndDate', e.target.value)}
                  className="form-input"
                />
              </FormField>
            )}
          </div>
        </div>

        {/* Salary */}
        <div className="card mb-5">
          <div className="card-header">
            <h2 className="text-base font-bold">Compensation</h2>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Basic Salary (ETB)" required error={errors.basicSalary}>
              <input
                type="number"
                value={form.basicSalary}
                onChange={(e) => updateField('basicSalary', e.target.value)}
                min="0"
                step="0.01"
                placeholder="Monthly basic salary"
                className={inputClass('basicSalary')}
              />
            </FormField>
            <FormField label="Housing Allowance (ETB)">
              <input
                type="number"
                value={form.housingAllowance}
                onChange={(e) => updateField('housingAllowance', e.target.value)}
                min="0"
                step="0.01"
                className="form-input"
              />
            </FormField>
            <FormField label="Transport Allowance (ETB)">
              <input
                type="number"
                value={form.transportAllowance}
                onChange={(e) => updateField('transportAllowance', e.target.value)}
                min="0"
                step="0.01"
                className="form-input"
              />
            </FormField>
            <FormField label="Medical Allowance (ETB)">
              <input
                type="number"
                value={form.medicalAllowance}
                onChange={(e) => updateField('medicalAllowance', e.target.value)}
                min="0"
                step="0.01"
                className="form-input"
              />
            </FormField>
            <FormField label="TIN Number">
              <input
                type="text"
                value={form.tinNumber}
                onChange={(e) => updateField('tinNumber', e.target.value)}
                className="form-input"
              />
            </FormField>
            <FormField label="Pension Number">
              <input
                type="text"
                value={form.pensionNumber}
                onChange={(e) => updateField('pensionNumber', e.target.value)}
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
                className="form-input"
              />
            </FormField>
          </div>
        </div>

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

        <div className="flex items-center justify-between">
          <Link to="/employees" className="btn-outline">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary">
            {createMutation.isPending ? (
              <>
                <div className="spinner-sm" /> Creating Employee...
              </>
            ) : (
              '✓ Create Employee'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployeePage;
