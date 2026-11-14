import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../services/api'

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
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
  'Other'
]
const QUALIFICATIONS = ['Certificate', 'Diploma', 'Degree', 'Masters', 'PhD']
const PHONE_RE = /^(\+251|251|0)?[79]\d{8}$/

const Field = ({ label, error, required, children }) => (
  <div className='form-group'>
    <label className='form-label'>
      {label} {required && <span className='text-red-500'>*</span>}
    </label>
    {children}
    {error && <p className='form-error'>{error}</p>}
  </div>
)

const AddTeacherPage = () => {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [errors, setErrors] = useState({})
  const [f, setF] = useState({
    firstName: '',
    fatherName: '',
    grandFatherName: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    email: '',
    primarySubject: '',
    gradesCanTeach: [],
    qualification: '',
    fieldOfStudy: '',
    university: '',
    yearsOfExperience: '0',
    joinDate: new Date().toISOString().split('T')[0],
    employmentType: 'Full-Time',
    basicSalary: ''
  })

  const set = (k, v) => {
    setF(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: null }))
  }
  const toggleGrade = g =>
    set(
      'gradesCanTeach',
      f.gradesCanTeach.includes(g)
        ? f.gradesCanTeach.filter(x => x !== g)
        : [...f.gradesCanTeach, g]
    )
  const cls = k => (errors[k] ? 'form-input-error' : 'form-input')

  const create = useMutation({
    mutationFn: payload => api.post('/teachers', payload),
    onSuccess: res => {
      const t = res.data.data.teacher
      toast.success(`Teacher created: ${t.teacherId}`)
      qc.invalidateQueries({ queryKey: ['teachers'] })
      navigate(`/teachers/${t._id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Could not create teacher.')
  })

  const submit = e => {
    e.preventDefault()
    const er = {}
    if (!f.firstName.trim()) er.firstName = 'Required'
    if (!f.fatherName.trim()) er.fatherName = 'Required'
    if (!f.gender) er.gender = 'Required'
    if (!f.dateOfBirth) er.dateOfBirth = 'Required'
    if (!PHONE_RE.test(f.phone)) er.phone = 'Enter a valid Ethiopian phone number'
    if (!f.primarySubject) er.primarySubject = 'Required'
    if (f.gradesCanTeach.length === 0) er.gradesCanTeach = 'Select at least one grade'
    if (!f.qualification) er.qualification = 'Required'
    if (!f.fieldOfStudy.trim()) er.fieldOfStudy = 'Required'
    setErrors(er)
    if (Object.keys(er).length) return

    create.mutate({
      firstName: f.firstName.trim(),
      fatherName: f.fatherName.trim(),
      grandFatherName: f.grandFatherName.trim() || undefined,
      gender: f.gender,
      dateOfBirth: f.dateOfBirth,
      phone: f.phone,
      email: f.email || undefined,
      primarySubject: f.primarySubject,
      gradesCanTeach: f.gradesCanTeach,
      qualification: f.qualification,
      fieldOfStudy: f.fieldOfStudy.trim(),
      university: f.university || undefined,
      yearsOfExperience: parseInt(f.yearsOfExperience) || 0,
      joinDate: f.joinDate,
      employmentType: f.employmentType,
      salary: { basicSalary: parseFloat(f.basicSalary) || 0 }
    })
  }

  return (
    <form onSubmit={submit} className='max-w-3xl mx-auto space-y-5'>
      <div className='text-sm text-slate-500'>
        <Link to='/teachers'>Teachers</Link> / <b className='text-slate-900'>Add teacher</b>
      </div>

      <div className='card'>
        <div className='card-header'>
          <h2 className='font-bold'>Personal information</h2>
        </div>
        <div className='card-body grid grid-cols-1 md:grid-cols-2 gap-x-4'>
          <Field label='First name' required error={errors.firstName}>
            <input
              className={cls('firstName')}
              value={f.firstName}
              onChange={e => set('firstName', e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Father's name" required error={errors.fatherName}>
            <input
              className={cls('fatherName')}
              value={f.fatherName}
              onChange={e => set('fatherName', e.target.value)}
            />
          </Field>
          <Field label="Grandfather's name">
            <input
              className='form-input'
              value={f.grandFatherName}
              onChange={e => set('grandFatherName', e.target.value)}
            />
          </Field>
          <Field label='Gender' required error={errors.gender}>
            <select
              className={cls('gender')}
              value={f.gender}
              onChange={e => set('gender', e.target.value)}
            >
              <option value=''>Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Field>
          <Field label='Date of birth' required error={errors.dateOfBirth}>
            <input
              type='date'
              className={cls('dateOfBirth')}
              value={f.dateOfBirth}
              max={new Date().toISOString().split('T')[0]}
              onChange={e => set('dateOfBirth', e.target.value)}
            />
          </Field>
          <Field label='Phone' required error={errors.phone}>
            <input
              className={cls('phone')}
              value={f.phone}
              placeholder='+251911234567'
              onChange={e => set('phone', e.target.value)}
            />
          </Field>
          <Field label='Email'>
            <input
              type='email'
              className='form-input'
              value={f.email}
              onChange={e => set('email', e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className='card'>
        <div className='card-header'>
          <h2 className='font-bold'>Professional information</h2>
        </div>
        <div className='card-body grid grid-cols-1 md:grid-cols-2 gap-x-4'>
          <Field label='Primary subject' required error={errors.primarySubject}>
            <select
              className={cls('primarySubject')}
              value={f.primarySubject}
              onChange={e => set('primarySubject', e.target.value)}
            >
              <option value=''>Select</option>
              {SUBJECTS.map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label='Qualification' required error={errors.qualification}>
            <select
              className={cls('qualification')}
              value={f.qualification}
              onChange={e => set('qualification', e.target.value)}
            >
              <option value=''>Select</option>
              {QUALIFICATIONS.map(q => (
                <option key={q}>{q}</option>
              ))}
            </select>
          </Field>
          <Field label='Field of study' required error={errors.fieldOfStudy}>
            <input
              className={cls('fieldOfStudy')}
              value={f.fieldOfStudy}
              onChange={e => set('fieldOfStudy', e.target.value)}
            />
          </Field>
          <Field label='University'>
            <input
              className='form-input'
              value={f.university}
              onChange={e => set('university', e.target.value)}
            />
          </Field>
          <Field label='Years of experience'>
            <input
              type='number'
              min='0'
              className='form-input'
              value={f.yearsOfExperience}
              onChange={e => set('yearsOfExperience', e.target.value)}
            />
          </Field>
          <Field label='Employment type'>
            <select
              className='form-select'
              value={f.employmentType}
              onChange={e => set('employmentType', e.target.value)}
            >
              {['Full-Time', 'Part-Time', 'Contract', 'Volunteer'].map(t => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label='Join date'>
            <input
              type='date'
              className='form-input'
              value={f.joinDate}
              onChange={e => set('joinDate', e.target.value)}
            />
          </Field>
          <Field label='Basic salary (ETB)'>
            <input
              type='number'
              min='0'
              className='form-input'
              value={f.basicSalary}
              onChange={e => set('basicSalary', e.target.value)}
            />
          </Field>
          <div className='md:col-span-2'>
            <Field label='Grades can teach' required error={errors.gradesCanTeach}>
              <div className='flex flex-wrap gap-2'>
                {GRADES.map(g => (
                  <button
                    key={g}
                    type='button'
                    onClick={() => toggleGrade(g)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                      f.gradesCanTeach.includes(g)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </div>
      </div>

      <div className='flex justify-between'>
        <Link to='/teachers' className='btn-outline'>
          Cancel
        </Link>
        <button type='submit' disabled={create.isPending} className='btn-primary'>
          {create.isPending ? 'Saving...' : 'Create teacher'}
        </button>
      </div>
    </form>
  )
}

export default AddTeacherPage
