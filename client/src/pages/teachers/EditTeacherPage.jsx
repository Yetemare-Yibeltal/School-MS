import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import api from '../../services/api'

const GRADES = ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']
const QUALIFICATIONS = ['Certificate', 'Diploma', 'Degree', 'Masters', 'PhD']
const STATUSES = ['active', 'inactive', 'on_leave', 'terminated', 'resigned']

const Field = ({ label, error, children }) => (
  <div className='form-group'>
    <label className='form-label'>{label}</label>
    {children}
    {error && <p className='form-error'>{error}</p>}
  </div>
)

const EditTeacherPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [f, setF] = useState(null)
  const [errors, setErrors] = useState({})

  const { data: teacher, isLoading } = useQuery({
    queryKey: ['teacher', id],
    queryFn: async () => (await api.get(`/teachers/${id}`)).data.data.teacher
  })

  useEffect(() => {
    if (teacher && !f) {
      setF({
        firstName: teacher.firstName || '',
        fatherName: teacher.fatherName || '',
        grandFatherName: teacher.grandFatherName || '',
        gender: teacher.gender || '',
        dateOfBirth: teacher.dateOfBirth
          ? new Date(teacher.dateOfBirth).toISOString().split('T')[0]
          : '',
        phone: teacher.phone || '',
        email: teacher.email || '',
        primarySubject: teacher.primarySubject || '',
        gradesCanTeach: teacher.gradesCanTeach || [],
        qualification: teacher.qualification || '',
        fieldOfStudy: teacher.fieldOfStudy || '',
        university: teacher.university || '',
        yearsOfExperience: String(teacher.yearsOfExperience || 0),
        employmentType: teacher.employmentType || 'Full-Time',
        status: teacher.status || 'active',
        basicSalary: String(teacher.salary?.basicSalary || '')
      })
    }
  }, [teacher, f])

  const update = useMutation({
    mutationFn: payload => api.patch(`/teachers/${id}`, payload),
    onSuccess: () => {
      toast.success('Teacher updated.')
      qc.invalidateQueries({ queryKey: ['teacher', id] })
      qc.invalidateQueries({ queryKey: ['teachers'] })
      navigate(`/teachers/${id}`)
    },
    onError: err => toast.error(err.response?.data?.message || 'Update failed.')
  })

  if (isLoading || !f) return <div className='card p-8 text-center text-slate-400'>Loading...</div>

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

  const submit = e => {
    e.preventDefault()
    const er = {}
    if (!f.firstName.trim()) er.firstName = 'Required'
    if (!f.fatherName.trim()) er.fatherName = 'Required'
    if (!/^(\+251|251|0)?[79]\d{8}$/.test(f.phone))
      er.phone = 'Enter a valid Ethiopian phone number'
    if (f.gradesCanTeach.length === 0) er.gradesCanTeach = 'Select at least one grade'
    setErrors(er)
    if (Object.keys(er).length) return

    update.mutate({
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
      fieldOfStudy: f.fieldOfStudy,
      university: f.university || undefined,
      yearsOfExperience: parseInt(f.yearsOfExperience) || 0,
      employmentType: f.employmentType,
      status: f.status,
      salary: { basicSalary: parseFloat(f.basicSalary) || 0 }
    })
  }

  return (
    <form onSubmit={submit} className='max-w-3xl mx-auto space-y-5'>
      <div className='text-sm text-slate-500'>
        <Link to='/teachers'>Teachers</Link> /{' '}
        <Link to={`/teachers/${id}`}>
          {teacher.firstName} {teacher.fatherName}
        </Link>{' '}
        / <b className='text-slate-900'>Edit</b>
      </div>

      <div className='card'>
        <div className='card-header'>
          <h2 className='font-bold'>Personal information</h2>
        </div>
        <div className='card-body grid grid-cols-1 md:grid-cols-2 gap-x-4'>
          <Field label='First name' error={errors.firstName}>
            <input
              className={cls('firstName')}
              value={f.firstName}
              onChange={e => set('firstName', e.target.value)}
            />
          </Field>
          <Field label="Father's name" error={errors.fatherName}>
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
          <Field label='Gender'>
            <select
              className='form-select'
              value={f.gender}
              onChange={e => set('gender', e.target.value)}
            >
              <option value=''>Select</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </Field>
          <Field label='Date of birth'>
            <input
              type='date'
              className='form-input'
              value={f.dateOfBirth}
              onChange={e => set('dateOfBirth', e.target.value)}
            />
          </Field>
          <Field label='Phone' error={errors.phone}>
            <input
              className={cls('phone')}
              value={f.phone}
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
          <Field label='Primary subject'>
            <input
              className='form-input'
              value={f.primarySubject}
              onChange={e => set('primarySubject', e.target.value)}
            />
          </Field>
          <Field label='Qualification'>
            <select
              className='form-select'
              value={f.qualification}
              onChange={e => set('qualification', e.target.value)}
            >
              {QUALIFICATIONS.map(q => (
                <option key={q}>{q}</option>
              ))}
            </select>
          </Field>
          <Field label='Field of study'>
            <input
              className='form-input'
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
          <Field label='Status'>
            <select
              className='form-select'
              value={f.status}
              onChange={e => set('status', e.target.value)}
            >
              {STATUSES.map(s => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
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
            <Field label='Grades can teach' error={errors.gradesCanTeach}>
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
        <Link to={`/teachers/${id}`} className='btn-outline'>
          Cancel
        </Link>
        <button type='submit' disabled={update.isPending} className='btn-primary'>
          {update.isPending ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

export default EditTeacherPage
